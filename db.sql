
-- Tabla de Empresas
CREATE TABLE companies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

-- Tabla de Usuarios
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('Admin', 'Operator', 'Lector')),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Principal de Documentos (Trámites)
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    trarnite_number VARCHAR(100) UNIQUE NOT NULL,
    company_id VARCHAR(50) REFERENCES companies(id),
    authority VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    notification_date DATE NOT NULL,
    days_limit INTEGER DEFAULT 0,
    day_type VARCHAR(20) CHECK (day_type IN ('Días hábiles', 'Días calendario')),
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Inicializado' CHECK (status IN ('Inicializado', 'En progreso', 'Completado', 'Vencido')),
    summary_es TEXT,
    summary_cn TEXT,
    file_name VARCHAR(255),
    related_doc_id VARCHAR(50) REFERENCES documents(id),
    created_by VARCHAR(50) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_edited_by VARCHAR(50) REFERENCES users(id),
    last_edited_at TIMESTAMP
);

-- Tabla de Anexos / Archivos Adjuntos (Documento Original)
CREATE TABLE document_attachments (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES documents(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Contestaciones / Respuestas a la Autoridad
CREATE TABLE contestations (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES documents(id) ON DELETE CASCADE,
    presentation_date DATE NOT NULL,
    authority_received VARCHAR(255) NOT NULL,
    notes TEXT,
    contact_method VARCHAR(100),
    registered_by VARCHAR(50) REFERENCES users(id),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Archivos de Contestación
CREATE TABLE contestation_files (
    id VARCHAR(50) PRIMARY KEY,
    contestation_id VARCHAR(50) REFERENCES contestations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT
);

-- Tabla de Sesiones Activas
CREATE TABLE sessions (
    token VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Tabla de Actividades / Tareas (Checklist)
CREATE TABLE activities (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) REFERENCES documents(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    sub_description TEXT,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed')),
    priority VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    completed_by VARCHAR(50) REFERENCES users(id),
    completed_at TIMESTAMP
);

-- Usuario administrador por defecto (contraseña: Password123, cambiar tras primer acceso)
-- La contraseña se almacena como SHA256(id || password) para coincidir con la lógica del servidor
INSERT INTO users (id, name, email, password_hash, role) VALUES (
  'u1',
  'Administrador',
  'impuestos@corriente.com.ec',
  SHA2(CONCAT('u1', 'Password123'), 256),
  'Admin'
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_doc_trarnite ON documents(trarnite_number);
CREATE INDEX idx_doc_status ON documents(status);
CREATE INDEX idx_doc_due_date ON documents(due_date);
CREATE INDEX idx_activity_doc ON activities(document_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
