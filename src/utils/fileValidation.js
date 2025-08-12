    function validateFile(file) {
    if (!file) throw new Error("No se subió ningún archivo");
    
    const allowedTypes = ["image/jpeg", "image/png"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
        throw new Error("Solo se permiten imágenes JPEG o PNG");
    }

    if (file.size > maxSize) {
        throw new Error("El archivo excede el límite de 5MB");
    }
    }

    module.exports = { validateFile };