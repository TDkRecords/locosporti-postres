# Herramientas
- Code: Sveltekit, Javascript, Tailwind, FontAwesome
- Compilación: pnpm, Capacitor, Tauri
- DB: Firebase
- Auth: Google OAuth Firebase - Cliente, Usuario y Contraseña - Admin.
- Notificaciones: Firebase Cloud Messaging (FCM)
- Images: Cloudinary

# Paleta a usar:
- #FFFB96
- #FFE28A
- #FFD2A8
- #FFCDDB
- #CDB9FE

# Panel Administrador
- ### DASHBOARD:
	- Pedidos hoy
	- Pendientes
	- Preparando
	- En domicilio
	- Entregados
	- Ingresos del día
	- Egresos
	- Ganancia
	- Stock bajo
- ### PRODUCTOS:
    - Ver listado de productos
    - Editar detalles del producto:
	    1. ID (UUID - Oculto solo sistema)
	    2. Imagen (se suben a cloudinary)
	    3. Nombre
	    4. Costo de creación
	    5. Precio de venta (unidades)
		    - No se vende x lote
		6. Ganancia (total numérica - Reactivo $state())
		7. Rentabilidad (porcentual - Reactivo $state())
	    8. Stock (debe reducirse automáticamente al registrar pedidos como "Empacado", si se cancelan pedidos el stock regresa)
	    9. Fecha de creación
	- Soft Delete - Nunca eliminar solo marcar estados como:
		1. Agotado (automáticamente cuando el stock se reduce a 0)
		2. Descontinuado
		3. No disponible temporalmente
		4. Cuando un producto vuelve a estar disponible lanzar automáticamente la alerta (FCM) para que los usuarios puedan pedir nuevamente
	- Filtrar por:
		1. Fecha: 1D - 7D - 30D - 12M - ALL - Custom
		2. Precio de venta Mayor / Menor
		3. Stock Mayor / Menor
		4. Costo de creación Mayor / Menor
		5. Rentabilidad Mayor / Menor
		6. Ganancia Mayor / Menor
	- Barra de búsqueda para:
		1. Nombre
- ### CUENTAS:
    1. Ganancias:
        - Ver ganancias de pedidos por transferencia
        - Ver ganancias de pedidos a contra entrega una vez marcados como pagados
            - Si el cliente no paga no se reflejan las ganancias
        - Ver ganancias totales sumadas
        - Ver ganancias filtradas por 1 día automáticamente
        - Filtrar ganancias por:
            1. Fecha: 1D - 7D - 30D - 12M - ALL - Custom
            2. Clientes Transferencia con orden mayor / menor
            3. Clientes Contra entrega con orden mayor menor
            4. Orden Mayor / Menor monto de ingreso
        - Barra de búsqueda para:
            1. Clientes
    2. Egresos:
        - Ver gastos filtrados por 1D
        - Formulario de gastos:
            - Detalle
            - Monto
            - Fecha (Now predeterminado)
        - Editar Gastos
        - Soft Delete
            - Ningún gasto se elimina, se etiquetan como eliminados
            - Los gastos etiquetados como eliminados devuelven las ganancias
        - Filtro para:
            1. Fecha: 1D - 7D - 30D - 12M - ALL - Custom
            2. Monto orden mayor / menor
            3. Eliminados orden por fecha mayor / menor
            4. Eliminados orden por monto mayor / menor
        - Barra de búsqueda para:
            1. Detalle
            2. Monto
    3. Resumen:
        - Balance general (Ingresos - Egresos)
        - Balace Mensual
        - Balance Anual
        - Historial de balance (anteriores años)
        - Filtrar por:
            1. Fecha Custom
- ### PEDIDOS
    - Ver pedidos:
	    1. ID (UUID - oculto solo sistema)
        2. # del pedido (será igual al numero de la factura)
        3. Productos
        4. Info del cliente desplegable
        5. Notas
        6. Fecha y Hora del pedido
        7. Subtotal
        8. Pago - Estados: 
            -  Pendiente (A contra entrega)
            - Pagado (A contra entrega)
            - Pagado (Transferencia)
            - Rembolsado
        9. Historial desplegable del estado del pedido con fecha y hora (Pendiente -> Preparando -> Empacado -> A domicilio -> Entregado | Cancelado)
	        1. Foto resultante de domicilio exitoso (Prueba Fotográfica antes cualquier caso de fraude o intento del mismo)
    - Cancelar pedidos (Soft Delete)
        - Ningún pedido debe ser eliminado
        - Solo se marcan los pedidos como Cancelados
    - Filtrar pedidos por:
        1. Fecha: 1D - 7D - 30D - 12M - ALL - Custom
        2. Clientes (#)
        3. Modo de pago
        4. Producto
- ### FACTURAS:
	 - Ver pedidos con facturas aprobadas (pagadas - historial)
	 - Ver pedidos con facturas por aprobar
	 - Gestionar facturas por aprobar:
		 1. ID: (UUID - Oculto, Solo sistema)
		 2. # de Factura (El mismo que el # de Pedido)
		 3. Productos
		 4. Cliente
		 5. Monto a pagar
			 - Las facturas que se pagan por transferencia (no a contra entrega) se aprueban automáticamente generando el recibo digital y enviándolo al correo del Cliente para presentarlo al domiciliario
			 - Una vez el pedido a contra entrega se entregue al cliente, el admin cambia el estado de la factura "Pendiente" a "Pagada".
	 - Soft Delete: No se eliminan facturas, se marcan como canceladas.
		 - Si el cliente ya pagó por transferencia (No a contra entrega) se realiza la devolución del dinero.
	- Filtrar por:
		 1. Fecha: 1D - 7D - 30D - 12M - ALL - Custom
		 2. Facturas Aprobadas / Pendientes / Canceladas
		 3. Monto Mayor / Menor
	- Barra de búsqueda para:
		1. Clientes
		2. Producto
- ### CLIENTES
    - Ver listado de clientes
    - Filtrar clientes por:
        1. Pedidos Realizados / Cancelados con Opciones de orden Mayor / Menor
        2. Fecha: 1D - 7D - 30D - 12M - ALL - Custom
        3. Suspendidos
    - Barra de busqueda para:
        1. Nombre y Apellido
        2. Correo
        3. Dirección
    - Ver información de cada cliente:
        1. ID (UUID - Oculto, solo sistema)
        2. Foto
        3. Nombre
        4. Apellido
        5. Correo
        6. Dirección
        7. Historial de pedidos y sus estados (Entegado / Cancelado)
        8. Forma de pago de los pedidos
        9. Fecha y Hora de los pedidos
        10. Notas Adicionales
    - Editar la información de cada cliente
    - Suspender Clientes (Soft Delete)
        - Nunca se borran clientes solo se marcan como suspendidos/baneados
        - Una vez suspendido/baneado el cliente, la aplicación No deja que el cliente solicite pedidos a contra entrega durante el tiempo estipulado por el administrador según el motivo de suspensión o baneo

- ### FIDELIDAD
	- Lista de cliente y su numero pedidos completados/entregados en total
	- Ver, Gestionar, y Eliminar premios por llegar a cierta cantidad de pedidos, se pone una meta y en la vista de los clientes se puede ver esa meta y aquellos que la cumplan ganan el premio, Las metas pueden tener una fecha de caducidad determinada o ser indefinidas de caducidad
	- El estado de las metas debe ser guardado como historial
	- Ver metas pasadas y los clientes que la alcanzaron como historial
	- Si el cliente lleva 15 pedidos y sale una meta al completar los 20 pedidos no debe aparecerle como 0/20 sino como 15/20.
	- Sugerencias se aceptan!
- ### LOGIN
		El apartado de Login se hace sin registro el superadmin (yo) registra en la db el usuario y la contraseña que se requiera para que el usuario pueda entrar según su cuenta y trabajar la aplicación, el login debe ser la pantalla principal al abrir la aplicación de admin por primera vez, por lo que no se debe mostrar nada en pantalla hasta que el usuario se loggee y lo mande al dashboard
	- Usuario
	- Contraseña
# Panel Cliente:
- Registro (OAuth Google con Firebase)
	- Después de usar su cuenta de Google para obtener su foto y su correo, se pasa a un formulario para pedir su nombre, apellido y edad, al dar siguiente otro formulario para ingresar la dirección (para el domicilio) con campos de:
		1. Input (calle, carrera, mnz, diagonal)
		2. Input (# de calle)
		3. Input (- Complemento de calle)
		4. Input (Casa, Condominio, Edificio, Piso, Apto, Tienda)
		5. Input (Sugerencias para llegar a casa)
		- Como un ejemplo: Calle 22 #1 - 30, Condominio Los Pinos, Apto 304
	- Checkbox acuerdo de términos, condiciones y tratamiento de los datos
- Login:
	- Normalmente la sesión debe guardarse pero si el usuario sale o la sesión se cierra, al usar nuevamente su cuenta de Google puede volver a abrirla y entrar a su cuenta

La barra de navegación para el usuario será una barra de navegación inferior (bottom bar)
- Home:
	- Barra de búsqueda de productos
	- Filtro para:
		- Precio
		- Fecha (El primero / El ultimo)
	- Ver los productos:
		1. Foto
		2. Nombre
		3. Precio
		4. Botón WhatsApp, se piden los productos por WhatsApp
- Blog:
	- Actualizaciones del emprendimiento
	- Actualizaciones de próximo stock
	- Actualizaciones de nuevos productos
	- Actualizaciones de la política del sistema
	- IMPORTANT!: todas las actualizaciones del blog llegan a través de la landing oficial del negocio, no se suben al app o firebase, se hace una consulta a la landing y se reflejan en la app, la landing estará en "locosporti.netlify.app/blog"
- Fidelidad:
	- ver productos pedidos
	- ver el tiempo con nosotros
	- ver la meta de pedidos para recibir un regalo al igual que el historial de las metas expiradas en caso de haberlas y las metas expiradas pero cumplidas en caso de haberlas
	- tener un código QR generado con los datos de su perfil (nombre, apellido, dirección y teléfono) si el usuario cambia algo de su cuenta como su dirección o teléfono, el QR debe cambiar
- Perfil:
	- Ver su información personal
	- Actualizar su información personal
		- Debe quedar registro de cambios para poder verlo en el admin
	- Desactivar su cuenta
	- Eliminar su cuenta
		- SoftDelete - no se elimina la cuenta para el admin solo aparece marcada como eliminada en su estado de usuario
