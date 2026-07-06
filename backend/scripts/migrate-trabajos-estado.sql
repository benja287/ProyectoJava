-- Convierte trabajos.estado de ENUM legacy a VARCHAR para soportar PRECHECK_OK, PRECHECK_OBSERVADO, EN_EVALUACION, etc.
-- Ejecutar una vez en phpMyAdmin si el precheck apto no persiste en BD.
-- Trabajos observados en precheck (intentos 1-2) que quedaron ENVIADO:
-- UPDATE trabajos SET estado = 'PRECHECK_OBSERVADO' WHERE estado = 'ENVIADO' AND precheck_intentos > 0 AND precheck_intentos < 3;
ALTER TABLE trabajos MODIFY COLUMN estado VARCHAR(50) NOT NULL;
