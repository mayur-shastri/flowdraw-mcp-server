import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import DiagramService from "../services/diagram.service";

class DiagramController {
    static generateDiagram = expressAsyncHandler(async (req: Request, res: Response) => {
        const {userPrompt} = req.body;
        const generatedDiagram = await DiagramService.generateDiagram(userPrompt);
        if(!generatedDiagram){
            res.status(404);
            res.json({error: "Failed to generate diagram. Feel free to try again later."});
        } else {
            res.status(200);
            res.json(generatedDiagram);
        }
    });
}

export default DiagramController;