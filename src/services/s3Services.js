// s3Services.js - MODIFICADO CON ELIMINACIÓN DE IMÁGENES

import { S3Client, PutObjectCommand, DeleteObjectCommand,GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
    region: "us-east-2",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Función original para subir archivos
export async function uploadToS3(bucket, key, body, contentType) {
    const params = {
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: 'AES256', // Requerido para S3 Express
    };

    try {
        await s3.send(new PutObjectCommand(params));
        return `https://${bucket}.s3express-use2-az1.us-east-2.amazonaws.com/${key}`;
    } catch (error) {
        console.error("Error al subir archivo a S3:", error);
        throw error;
    }
}

// NUEVA FUNCIÓN: Eliminar imagen de S3
export async function deleteFromS3(bucket, key) {
    const params = {
        Bucket: bucket,
        Key: key
    };

    try {
        await s3.send(new DeleteObjectCommand(params));
        console.log(`✅ Imagen eliminada exitosamente de S3: ${key}`);
        return true;
    } catch (error) {
        console.error("❌ Error al eliminar archivo de S3:", error);
        throw error;
    }
}

// NUEVA FUNCIÓN: Extraer key de S3 desde URL completa
export function extractS3KeyFromUrl(url) {
    try {
        if (!url) return null;
        
        // Tu URL tiene formato: https://bucket.s3express-use2-az1.us-east-2.amazonaws.com/key
        const urlParts = url.split('/');
        // Obtener todo después del dominio
        const key = urlParts.slice(3).join('/');
        return key;
    } catch (error) {
        console.error("Error al extraer key de URL:", error);
        return null;
    }
}

// NUEVA FUNCIÓN: Eliminar imagen anterior usando URL
export async function deleteImageByUrl(imageUrl) {
    try {
        if (!imageUrl) {
            console.log("No hay imagen anterior para eliminar");
            return true;
        }

        const bucket = process.env.AWS_S3_BUCKET;
        const key = extractS3KeyFromUrl(imageUrl);
        
        if (!key) {
            console.log("No se pudo extraer la key de la URL:", imageUrl);
            return false;
        }

        await deleteFromS3(bucket, key);
        return true;
    } catch (error) {
        console.error("Error al eliminar imagen por URL:", error);
        // No lanzar error para que no interrumpa el flujo principal
        return false;
    }
    
}


// NUEVA FUNCIÓN: Generar URL firmada temporal para acceso a imagen privada
export async function getSignedUrlFromS3(bucket, key, expiresInSeconds = 300) {
    try {
        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        const signedUrl = await getSignedUrl(s3, command, {
            expiresIn: expiresInSeconds, // por defecto: 5 minutos
        });

        return signedUrl;
    } catch (error) {
        console.error("❌ Error al generar URL firmada:", error);
        throw error;
    }
}


// PASO 1: Ve a AWS Console
// PASO 2: Busca IAM > Users > tu usuario
// PASO 3: Attach esta política ACTUALIZADA:

/*
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3express:*"
            ],
            "Resource": [
                "arn:aws:s3express:us-east-2:954566026593:bucket/medicitas-dev-2025--use2-az1--x-s3",
                "arn:aws:s3express:us-east-2:954566026593:bucket/medicitas-dev-2025--use2-az1--x-s3/*"
            ]
        }
    ]
}
*/

// PASO 4: Ve a S3 > tu bucket > Permissions > Bucket Policy
// PASO 5: Pega esta política (IGUAL QUE ANTES):

/*
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::954566026593:root"
            },
            "Action": "s3express:*",
            "Resource": [
                "arn:aws:s3express:us-east-2:954566026593:bucket/medicitas-dev-2025--use2-az1--x-s3",
                "arn:aws:s3express:us-east-2:954566026593:bucket/medicitas-dev-2025--use2-az1--x-s3/*"
            ]
        }
    ]
}
*/