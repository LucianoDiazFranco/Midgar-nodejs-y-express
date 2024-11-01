// doc_pdf.routes.js
import { Router } from 'express';
import multer from 'multer';
import { join } from 'path';
import fs from 'fs';
import { unlink } from 'fs/promises';
import pool from '../database.js';

const router = Router();
const uploadsDir = join(process.cwd(), 'uploads');  // Ruta a la carpeta 'uploads'

// Configuración de Multer para cargar archivos PDF
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const date = new Date().toISOString().split('T')[0]; // Formato de fecha YYYY-MM-DD
        const newFileName = `${date}-${file.originalname}`;
        cb(null, newFileName);
    }
});
const upload = multer({ storage });

// Ruta para subir archivos
router.post('/upload', upload.array('pdfs', 10), async (req, res) => {
    try {
        const { rama } = req.body;
        const date = new Date().toISOString().split('T')[0]; // Formato de fecha para el campo `fecha`
        
        for (const file of req.files) {
            // Insertar solo el nombre original en la base de datos sin la fecha prefijada
            await pool.query('INSERT INTO Doc_PDF (nombre, fecha, rama) VALUES (?, ?, ?)', [file.originalname, date,rama]);
        }
        
        res.status(200).send('Archivos cargados y registrados en la base de datos exitosamente.');
    } catch (err) {
        console.error('Error al guardar en la base de datos:', err);
        res.status(500).send('Error al cargar archivos.');
    }
});

// Ruta para listar archivos PDF en la carpeta 'uploads'
router.get('/list-pdfs/:rama', async (req, res) => {
    const { rama } = req.params;
    try {
        const [documents] = await pool.query('SELECT nombre FROM Doc_PDF WHERE rama = ?', [rama]);
        const pdfFiles = documents.map(doc => doc.nombre);
        res.json(pdfFiles);
    } catch (error) {
        console.error('Error al obtener los archivos PDF:', error);
        res.status(500).json({ error: 'Error al obtener los archivos PDF' });
    }
});

// Ruta para eliminar un archivo PDF
router.delete('/delete-pdf/:filename', async (req, res) => {
    const filename = req.params.filename;
    const filePath = join(uploadsDir, filename);

    try {
        await unlink(filePath);
        res.status(200).send(`Archivo ${filename} eliminado.`);
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el archivo' });
    }
});

export default router;