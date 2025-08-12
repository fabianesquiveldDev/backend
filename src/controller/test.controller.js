import TestModel from '../models/test.model.js';

export const getServerTime = async (req, res) => {
    try {
    const time = await TestModel.getTime();
    res.json({ time });
    } catch (err) {
    res.status(500).json({ error: 'Error al obtener la hora del servidor' });
    }
};
