import { db } from "$lib/firebase.js";
import {
    collection,
    query,
    orderBy,
    where,
    onSnapshot,
    addDoc,
    setDoc,
    doc,
    updateDoc,
    getDoc,
    getDocs,
    runTransaction,
    limit,
} from "firebase/firestore";

const ensureDb = () => {
    if (!db) {
        throw new Error("Firestore no está inicializado. Ejecuta la app en el navegador y asegúrate de que Firebase esté configurado.");
    }
};

const collectionRef = (collectionName) => {
    ensureDb();
    return collection(db, collectionName);
};

const collectionQuery = (collectionName, orderField = "fecha") => {
    return query(collectionRef(collectionName), orderBy(orderField, "desc"));
};

export const watchCollection = (collectionName, callback, orderField = "fecha") => {
    const q = collectionQuery(collectionName, orderField);
    return onSnapshot(q, (snapshot) => {
        callback(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
    });
};

export const watchCollectionWhere = (collectionName, field, op, value, callback, orderField = "fecha") => {
    ensureDb();
    const q = query(
        collectionRef(collectionName),
        where(field, op, value),
        orderBy(orderField, "desc"),
    );
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
};

export const getCollectionOnce = async (collectionName, orderField = "fecha") => {
    const q = collectionQuery(collectionName, orderField);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getDocumentsWhere = async (collectionName, field, op, value, orderField = "fecha") => {
    ensureDb();
    const q = query(
        collectionRef(collectionName),
        where(field, op, value),
        orderBy(orderField, "desc"),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getDocumentByField = async (collectionName, field, op, value) => {
    const docs = await getDocumentsWhere(collectionName, field, op, value);
    return docs.length ? docs[0] : null;
};

export const saveDocument = async (collectionName, payload) => {
    if (!payload.id) {
        const docRef = await addDoc(collectionRef(collectionName), {
            ...payload,
            fecha: payload.fecha || new Date().toISOString(),
        });
        return { ...payload, id: docRef.id };
    }

    const ref = doc(db, collectionName, payload.id);
    await setDoc(ref, payload, { merge: true });
    return payload;
};

export const updateDocument = async (collectionName, id, updates) => {
    const ref = doc(db, collectionName, id);
    await updateDoc(ref, updates);
};

export const getDocument = async (collectionName, id) => {
    const ref = doc(db, collectionName, id);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

// ─── Cliente Profile ────────────────────────────────────────────────────────

export const getClienteProfile = async (uid) => {
    ensureDb();
    const ref = doc(db, "clientes", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const isProfileComplete = (profile) => {
    return !!(profile && profile.nombre && profile.apellido && profile.direccion && profile.telefono);
};

export const saveClienteProfile = async (uid, profileData) => {
    ensureDb();
    const ref = doc(db, "clientes", uid);
    const now = new Date().toISOString();
    await setDoc(ref, { ...profileData, uid, updatedAt: now }, { merge: true });
    return { id: uid, uid, ...profileData };
};

export const updateClienteProfile = async (uid, updates) => {
    ensureDb();
    const ref = doc(db, "clientes", uid);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? snap.data() : {};

    // Registro de cambios
    const changeLog = Array.isArray(existing.changeLog) ? [...existing.changeLog] : [];
    const changed = {};
    for (const key of Object.keys(updates)) {
        if (existing[key] !== undefined && existing[key] !== updates[key]) {
            changed[key] = { from: existing[key], to: updates[key] };
        }
    }
    if (Object.keys(changed).length > 0) {
        changeLog.push({ cambios: changed, at: new Date().toISOString() });
    }

    await updateDoc(ref, { ...updates, changeLog, updatedAt: new Date().toISOString() });
};

// ─── Contador de pedidos (número secuencial) ─────────────────────────────────

export const getNextPedidoNumber = async () => {
    ensureDb();
    const counterRef = doc(db, "config", "pedidos_counter");
    let nextNumber = 1001;
    await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(counterRef);
        if (snap.exists()) {
            nextNumber = (snap.data().last || 1000) + 1;
        }
        transaction.set(counterRef, { last: nextNumber });
    });
    return nextNumber;
};

// ─── Pedidos + Facturas ───────────────────────────────────────────────────────

/**
 * Flujo lineal de estados de un pedido. Un pedido solo puede avanzar
 * al estado que le sigue inmediatamente, nunca retroceder ni saltar pasos.
 * "Cancelado" es la única excepción: se puede cancelar desde cualquier
 * estado que no sea "Entregado" o "Cancelado".
 */
export const ESTADOS_FLUJO_PEDIDO = ["Preparando", "Empacado", "A domicilio", "Entregado"];

/**
 * Devuelve el único estado siguiente válido para un pedido, o null si el
 * pedido ya llegó a un estado final (Entregado / Cancelado).
 */
export const siguienteEstadoPedido = (estadoActual) => {
    const idx = ESTADOS_FLUJO_PEDIDO.indexOf(estadoActual);
    if (idx === -1 || idx === ESTADOS_FLUJO_PEDIDO.length - 1) return null;
    return ESTADOS_FLUJO_PEDIDO[idx + 1];
};

/**
 * Valida que la transición de un estado a otro sea válida según el flujo
 * lineal (solo avanzar un paso a la vez) o una cancelación permitida.
 */
export const esTransicionEstadoValida = (estadoActual, estadoNuevo) => {
    if (estadoNuevo === estadoActual) return false;
    if (estadoNuevo === "Cancelado") {
        return estadoActual !== "Entregado" && estadoActual !== "Cancelado";
    }
    return siguienteEstadoPedido(estadoActual) === estadoNuevo;
};

/**
 * Valida que haya stock suficiente para cada ítem de un pedido.
 * @param {Array<{productId:string, cantidad:number}>} items
 * @param {Record<string, any>} productosMap - Mapa productId -> producto (con .stock y .nombre)
 * @param {Record<string, number>} [stockReservadoExtra] - Stock a "devolver" antes de validar
 *        (usado al editar un pedido que ya descontó stock, para no bloquear al mismo pedido)
 */
const validarStockDisponible = (items, productosMap, stockReservadoExtra = {}) => {
    for (const it of items) {
        const prod = productosMap[it.productId];
        if (!prod) {
            throw new Error("Uno de los productos del pedido ya no existe.");
        }
        const cantidadPedida = Number(it.cantidad) || 0;
        const stockDisponible =
            (Number(prod.stock) || 0) + (Number(stockReservadoExtra[it.productId]) || 0);

        if (cantidadPedida > stockDisponible) {
            throw new Error(
                `Stock insuficiente para "${prod.nombre}". Disponible: ${stockDisponible}, solicitado: ${cantidadPedida}.`,
            );
        }
    }
};

/**
 * Crea un pedido en Firestore y genera su factura automáticamente.
 * Si el método de pago es transferencia, la factura se aprueba automáticamente.
 * Lanza un error si algún producto no tiene stock suficiente para la cantidad pedida.
 */
export const crearPedidoConFactura = async (pedidoData, productosMap) => {
    ensureDb();

    const items = pedidoData.items || [];

    // No permitir registrar pedidos con más cantidad de la que hay en stock
    validarStockDisponible(items, productosMap);

    const numero = await getNextPedidoNumber();
    const fecha = new Date().toISOString();

    // Calcular total
    const total = items.reduce((sum, it) => {
        const prod = productosMap[it.productId];
        return sum + (prod?.precio || 0) * (Number(it.cantidad) || 0);
    }, 0);

    const pedidoRecord = {
        ...pedidoData,
        numero,
        fecha,
        estado: pedidoData.estado || "Preparando",
        history: [{ from: null, to: pedidoData.estado || "Preparando", at: fecha }],
        total,
    };

    // Crear el pedido
    const pedidoRef = await addDoc(collectionRef("pedidos"), pedidoRecord);
    const pedidoId = pedidoRef.id;

    // Estado de la factura según método de pago
    const estadoFactura =
        pedidoData.metodoPago === "transferencia" ? "aprobada" : "pendiente";

    const facturaRecord = {
        pedidoId,
        numero,
        clienteId: pedidoData.clienteId,
        items,
        monto: total,
        metodoPago: pedidoData.metodoPago || "contra_entrega",
        estado: estadoFactura,
        notas: pedidoData.notas || "",
        fecha,
    };

    await addDoc(collectionRef("facturas"), facturaRecord);

    return { id: pedidoId, ...pedidoRecord };
};

export const changeOrderStatus = async (orderId, newStatus, extraData = {}) => {
    ensureDb();
    const orderRef = doc(db, "pedidos", orderId);

    await runTransaction(db, async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw new Error("Pedido no encontrado");

        const order = orderSnap.data();
        const prevStatus = order.estado || null;
        const items = order.items || [];

        // El estado del pedido solo puede avanzar un paso a la vez
        // (Preparando -> Empacado -> A domicilio -> Entregado), sin retrocesos
        // ni saltos. "Cancelado" es la única excepción permitida.
        if (!esTransicionEstadoValida(prevStatus, newStatus)) {
            throw new Error(
                `No se puede cambiar el estado de "${prevStatus}" a "${newStatus}". El estado del pedido solo puede avanzar al siguiente paso del flujo (${ESTADOS_FLUJO_PEDIDO.join(" → ")}), o cancelarse.`,
            );
        }

        // Decrease stock when moving to Empacado (only once)
        if (newStatus === "Empacado" && prevStatus !== "Empacado") {
            for (const it of items) {
                const prodRef = doc(db, "productos", it.productId);
                const prodSnap = await transaction.get(prodRef);
                if (!prodSnap.exists()) throw new Error("Producto del pedido no existe");
                const currentStock = Number(prodSnap.data().stock) || 0;
                const newStock = currentStock - (Number(it.cantidad) || 0);
                transaction.update(prodRef, { stock: newStock });
                if (newStock <= 0) transaction.update(prodRef, { estado: "agotado" });
            }
        }

        // Restore stock when canceling an already-empacado pedido
        if (newStatus === "Cancelado" && prevStatus === "Empacado") {
            for (const it of items) {
                const prodRef = doc(db, "productos", it.productId);
                const prodSnap = await transaction.get(prodRef);
                const currentStock = Number(prodSnap.data().stock) || 0;
                const newStock = currentStock + (Number(it.cantidad) || 0);
                transaction.update(prodRef, { stock: newStock });
                if (newStock > 0 && prodSnap.data().estado === "agotado")
                    transaction.update(prodRef, { estado: "disponible" });
            }
        }

        // Update order status and append history
        const history = Array.isArray(order.history) ? [...order.history] : [];
        history.push({ from: prevStatus, to: newStatus, at: new Date().toISOString() });

        const updates = { estado: newStatus, history };
        if (extraData.fotoEntrega) updates.fotoEntrega = extraData.fotoEntrega;

        transaction.update(orderRef, updates);
    });

    // Sync factura state when order is cancelled
    if (newStatus === "Cancelado") {
        try {
            const q = query(collectionRef("facturas"), where("pedidoId", "==", orderId));
            const snap = await getDocs(q);
            for (const d of snap.docs) {
                await updateDoc(d.ref, { estado: "cancelada" });
            }
        } catch (e) {
            console.warn("No se pudo cancelar factura:", e);
        }
    }

    // Sync factura when delivered & paid (contra entrega)
    if (newStatus === "Entregado") {
        try {
            const orderSnap2 = await getDoc(orderRef);
            if (orderSnap2.exists() && orderSnap2.data().metodoPago === "contra_entrega") {
                const q = query(collectionRef("facturas"), where("pedidoId", "==", orderId));
                const snap = await getDocs(q);
                for (const d of snap.docs) {
                    await updateDoc(d.ref, { estado: "pendiente_pago" });
                }
            }
        } catch (e) {
            console.warn("No se pudo actualizar factura:", e);
        }
    }
};

/**
 * Actualiza un pedido existente desde el formulario de edición.
 * - Valida que la nueva cantidad no exceda el stock disponible (sumando de
 *   vuelta el stock que el propio pedido ya tenía reservado, si aplica).
 * - Si el estado cambia, delega en changeOrderStatus para respetar el flujo
 *   lineal, el historial y los movimientos de stock/factura asociados.
 * - Los demás campos (cliente, items, notas, método de pago) se actualizan
 *   directamente, ya que no afectan el flujo de estados.
 *
 * @param {string} pedidoId
 * @param {object} pedidoActual - El documento del pedido tal como está hoy en Firestore
 * @param {object} cambios - { clienteId, items, notas, metodoPago, estado }
 * @param {Record<string, any>} productosMap - Mapa productId -> producto
 * @param {object} [extraData] - Datos adicionales para el cambio de estado (ej. fotoEntrega)
 */
export const editarPedido = async (pedidoId, pedidoActual, cambios, productosMap, extraData = {}) => {
    ensureDb();

    const items = cambios.items || [];
    const estadoActual = pedidoActual.estado;
    const estadoNuevo = cambios.estado;
    const yaDescontoStock = ["Empacado", "A domicilio", "Entregado"].includes(estadoActual);

    // Si el pedido ya descontó stock (llegó a "Empacado" o más adelante) y el
    // producto no cambió, esa cantidad reservada se suma de vuelta al validar,
    // para no bloquear la edición del mismo pedido por su propio stock reservado.
    const stockReservadoExtra = {};
    if (yaDescontoStock) {
        for (const it of pedidoActual.items || []) {
            stockReservadoExtra[it.productId] =
                (stockReservadoExtra[it.productId] || 0) + (Number(it.cantidad) || 0);
        }
    }

    validarStockDisponible(items, productosMap, stockReservadoExtra);

    // Actualizar campos que no son el estado
    const updates = {
        clienteId: cambios.clienteId,
        items,
        notas: cambios.notas,
        metodoPago: cambios.metodoPago,
    };
    await updateDocument("pedidos", pedidoId, updates);

    // Si el estado cambió, delega el cambio a changeOrderStatus para que
    // aplique la validación de flujo lineal, historial y stock/factura.
    if (estadoNuevo && estadoNuevo !== estadoActual) {
        await changeOrderStatus(pedidoId, estadoNuevo, extraData);
    }
};

export const adjustProductStock = async (productId, delta) => {
    ensureDb();
    const prodRef = doc(db, "productos", productId);
    await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(prodRef);
        if (!snap.exists()) throw new Error("Producto no encontrado");
        const current = Number(snap.data().stock) || 0;
        const next = current + Number(delta || 0);
        transaction.update(prodRef, { stock: next });
        if (next <= 0) transaction.update(prodRef, { estado: "agotado" });
        else if (snap.data().estado === "agotado" && next > 0)
            transaction.update(prodRef, { estado: "disponible" });
    });
};

// ─── Egresos ─────────────────────────────────────────────────────────────────

export const saveEgreso = async (data) => {
    ensureDb();
    const record = {
        detalle: data.detalle || "",
        monto: Number(data.monto) || 0,
        fecha: data.fecha || new Date().toISOString(),
        eliminado: false,
    };
    const ref = await addDoc(collectionRef("egresos"), record);
    return { id: ref.id, ...record };
};

export const softDeleteEgreso = async (id) => {
    await updateDocument("egresos", id, { eliminado: true });
};

export const restoreEgreso = async (id) => {
    await updateDocument("egresos", id, { eliminado: false });
};

// ─── Facturas ─────────────────────────────────────────────────────────────────

export const aprobarFactura = async (id) => {
    await updateDocument("facturas", id, { estado: "aprobada", aprobadaAt: new Date().toISOString() });
};

export const cancelarFactura = async (id) => {
    await updateDocument("facturas", id, { estado: "cancelada", canceladaAt: new Date().toISOString() });
};

// ─── Metas de Fidelidad ──────────────────────────────────────────────────────

export const saveMeta = async (metaData) => {
    ensureDb();
    const record = {
        ...metaData,
        activa: true,
        fecha: new Date().toISOString(),
    };
    const ref = await addDoc(collectionRef("metas"), record);
    return { id: ref.id, ...record };
};

export const eliminarMeta = async (id, clientesAlcanzaron = []) => {
    ensureDb();
    const metaRef = doc(db, "metas", id);
    const snap = await getDoc(metaRef);
    if (!snap.exists()) return;

    const meta = snap.data();

    // Archivar en historial
    await addDoc(collectionRef("metas_historial"), {
        ...meta,
        clientesAlcanzaron,
        archivedAt: new Date().toISOString(),
    });

    // Marcar como inactiva
    await updateDoc(metaRef, { activa: false });
};