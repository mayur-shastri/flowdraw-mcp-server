import express from 'express';
import dotenv from 'dotenv';
import diagramRouter from './routes/diagram.route';
import cors from 'cors';

dotenv.config();

const app = express();

app.use(cors({
    origin: '*',
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res)=>{
    res.json({message: "Hello World MCP"});
});

app.use('/diagram', diagramRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}`);
});