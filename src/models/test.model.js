import { pool } from '../config/db.js'; // Importación nombrada

const TestModel = {
    getTime: async () => {
        const result = await pool.query('SELECT NOW()');
        return result.rows[0];
    }
};

export default TestModel;