-- AdFra OS / CoreWorkOS — PostgreSQL schema (v1.1.0)

CREATE TABLE IF NOT EXISTS monedas (
    id VARCHAR(3) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    simbolo VARCHAR(5) NOT NULL,
    tasa_referencia DECIMAL(14, 4) NOT NULL DEFAULT 1.0000,
    actualizado_el TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    empresa VARCHAR(120),
    email VARCHAR(100),
    telefono VARCHAR(30),
    notas TEXT,
    creado_el TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proyectos (
    id BIGSERIAL PRIMARY KEY,
    cliente_id BIGINT REFERENCES clientes(id),
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'propuesta'
        CHECK (estado IN ('propuesta', 'en_proceso', 'pausado', 'entregado', 'finalizado')),
    moneda_id VARCHAR(3) NOT NULL REFERENCES monedas(id),
    presupuesto_total DECIMAL(12, 2) NOT NULL,
    fecha_inicio DATE,
    fecha_limite DATE,
    creado_el TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cobros_hitos (
    id BIGSERIAL PRIMARY KEY,
    proyecto_id BIGINT NOT NULL REFERENCES proyectos(id),
    concepto VARCHAR(150) NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'cobrado', 'vencido')),
    fecha_pago DATE
);

CREATE TABLE IF NOT EXISTS categorias_financieras (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
    icono VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS transacciones (
    id BIGSERIAL PRIMARY KEY,
    uuid_sync VARCHAR(36) UNIQUE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
    categoria_id INT REFERENCES categorias_financieras(id),
    proyecto_id BIGINT REFERENCES proyectos(id),
    hito_id BIGINT REFERENCES cobros_hitos(id),
    monto DECIMAL(12, 2) NOT NULL,
    moneda_id VARCHAR(3) NOT NULL REFERENCES monedas(id),
    tasa_cambio DECIMAL(14, 4) NOT NULL DEFAULT 1.0000,
    metodo_pago VARCHAR(50),
    comprobante_ref VARCHAR(100),
    nota TEXT,
    fecha_transaccion DATE NOT NULL,
    creado_el TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wishlist (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    precio_estimado DECIMAL(12, 2) NOT NULL,
    moneda_id VARCHAR(3) NOT NULL REFERENCES monedas(id),
    monto_ahorrado DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    prioridad VARCHAR(10) NOT NULL DEFAULT 'media'
        CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
    enlace_compra VARCHAR(255),
    estado VARCHAR(20) NOT NULL DEFAULT 'deseado'
        CHECK (estado IN ('deseado', 'en_ahorro', 'comprado', 'descartado')),
    fecha_objetivo DATE
);

CREATE TABLE IF NOT EXISTS agenda_eventos (
    id BIGSERIAL PRIMARY KEY,
    proyecto_id BIGINT REFERENCES proyectos(id),
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(30) NOT NULL DEFAULT 'tarea'
        CHECK (tipo IN ('tarea', 'reunion', 'recordatorio_pago', 'evento_personal')),
    prioridad VARCHAR(10) NOT NULL DEFAULT 'media'
        CHECK (prioridad IN ('baja', 'media', 'alta')),
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    alarma_anticipacion_min INT NOT NULL DEFAULT 15,
    completado BOOLEAN NOT NULL DEFAULT FALSE,
    creado_el TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bitacora_notas (
    id BIGSERIAL PRIMARY KEY,
    uuid_sync VARCHAR(36) UNIQUE,
    titulo VARCHAR(150),
    contenido TEXT NOT NULL,
    etiquetas VARCHAR(150),
    fijado BOOLEAN NOT NULL DEFAULT FALSE,
    creado_el TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispositivos_push (
    id BIGSERIAL PRIMARY KEY,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    dispositivo_info VARCHAR(100),
    creado_el TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha_transaccion);
CREATE INDEX IF NOT EXISTS idx_agenda_fecha ON agenda_eventos(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_hitos_vencimiento ON cobros_hitos(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_hitos_estado ON cobros_hitos(estado);

-- Seed monedas
INSERT INTO monedas (id, nombre, simbolo, tasa_referencia) VALUES
    ('USD', 'Dólar estadounidense', '$', 1.0000),
    ('VES', 'Bolívar digital', 'Bs', 36.5000),
    ('EUR', 'Euro', '€', 0.9200)
ON CONFLICT (id) DO NOTHING;

-- Seed categorías
INSERT INTO categorias_financieras (nombre, tipo, icono) VALUES
    ('Freelance', 'ingreso', 'briefcase'),
    ('Salario', 'ingreso', 'wallet'),
    ('Alimentación', 'gasto', 'utensils'),
    ('Servicios', 'gasto', 'bolt'),
    ('Hardware', 'gasto', 'cpu'),
    ('Transporte', 'gasto', 'car'),
    ('Software', 'gasto', 'code')
ON CONFLICT DO NOTHING;
