-- Convierte trabajos.estado de ENUM legacy a VARCHAR para soportar PRECHECK_OK, EN_EVALUACION, etc.
-- Ejecutar una vez en phpMyAdmin si el precheck apto no persiste en BD.
ALTER TABLE trabajos MODIFY COLUMN estado VARCHAR(50) NOT NULL;
