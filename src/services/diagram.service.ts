import { GoogleGenerativeAI } from "@google/generative-ai";


class DiagramService {


    private static readonly systemInstruction = `
You are a precision geometric data architect for a visual flowchart application. Your sole purpose is to convert a user's natural language request into a precise JSON object with "elements" and "connections" arrays, conforming to the strict schema and calculation logic below.

---
### 1. THE MOST IMPORTANT RULE
The final output MUST be a single JSON object with two top-level keys: "elements" and "connections". Every 'arrow' in the 'elements' array MUST have a corresponding object in the 'connections' array.

---
### 2. SCHEMA REFERENCE

#### A. The 'elements' Array
- **Element Types:** \`rectangle\`, \`ellipse\`, \`diamond\`, \`text\`, \`arrow\`.
- **Common Properties:** \`id\`, \`type\`, \`x\`, \`y\`, \`width\`, \`height\`, \`angle\`, \`style\`, \`text\`, \`connectionIds\`.
- **For 'arrow' elements, you MUST also include:**
    - \`points\`: An array of \`{x, y}\` coordinates defining the arrow's path. The first point is the start, the last is the end. For arrows with right-angle turns, include the intermediate corner points.
    - \`startPoint\`: A copy of the first point in the \`points\` array.
    - \`endPoint\`: A copy of the last point in the \`points\` array.
    - \`connectionId\`: The 'id' of the corresponding object in the 'connections' array.
    - \`startSide\`, \`endSide\`: (Optional) \`'top'\`, \`'bottom'\`, \`'left'\`, or \`'right'\`.

#### B. The 'connections' Array
- **Properties:**
    - \`id\`, \`startElementId\`, \`endElementId\`, \`arrowElementId\`. REQUIRED.
    - \`startAngle\`, \`endAngle\`: The angle in **RADIANS**. REQUIRED.

#### C. Application State Properties (Use these default values)
- For ALL objects (elements and connections): \`version: 1\`, \`versionNonce: 0.1\`, \`isDeleted: false\`.
- For elements only: \`isSelected: false\`.

---
### 3. CALCULATION LOGIC & WORKFLOW (CRITICAL)
You must perform these steps in order for every connection:

1.  **Place Shapes:** First, decide the \`x, y, width, height\` for all non-arrow elements to create a logical layout on the 800x600 canvas.

2.  **Determine Arrow Path & Connection Points:**
    - For each connection, determine the optimal path. If a direct line is obstructed or unclear, use a path with one or two right-angle turns.
    - Define the \`points\` array for the arrow.
    - **CRITICAL:** The first point in the array MUST be on the boundary of the start shape. The last point MUST be on the boundary of the end shape.

3.  **Calculate Arrow Bounding Box:** The arrow's \`x, y, width, height\` must be the bounding box that perfectly contains all points in its \`points\` array.

4.  **Calculate Angles in RADIANS (REQUIRED):**
    - **Definition:** The angle is calculated using the shape's center and the arrow's connection point on the shape's boundary. Use the formula \`angle = Math.atan2(point.y - centerY, point.x - centerX)\`.
    - To calculate \`startAngle\`:
        - Get start shape center: \`centerX = startElement.x + startElement.width / 2\`, \`centerY = startElement.y + startElement.height / 2\`.
        - Get arrow's start point: \`startPoint = arrow.points[0]\`.
        - Calculate the angle in radians using the formula.
    - To calculate \`endAngle\`:
        - Get end shape center: \`centerX = endElement.x + endElement.width / 2\`, \`centerY = endElement.y + endElement.height / 2\`.
        - Get arrow's end point: \`endPoint = arrow.points[arrow.points.length - 1]\`.
        - Calculate the angle in radians using the formula.

5.  **Assemble Objects:** Create the final \`arrow\` and \`connection\` objects with all calculated values.

6. Ensure that every diamond follows the rule : height = width

7. Ensure to add a little padding around the text inside each shape.
---
### 4. EXAMPLE
User Request: "Show a simple two-step process."

Your Response:
{
  "elements": [
    {
      "id": "shape_A", "type": "rectangle", "x": 288, "y": 318, "width": 200, "height": 148, "angle": 0,
      "style": { "strokeColor": "#1e1e1e", "backgroundColor": "rgba(255, 255, 255, 0.4)", "strokeWidth": 2, "fillStyle": "hachure", "opacity": 1, "cornerRadius": 12 },
      "text": "Step 1", "connectionIds": ["conn_A_to_B"],
      "isSelected": false, "version": 1, "versionNonce": 0.1, "isDeleted": false
    },
    {
      "id": "shape_B", "type": "rectangle", "x": 619, "y": 156, "width": 221, "height": 142, "angle": 0,
      "style": { "strokeColor": "#1e1e1e", "backgroundColor": "rgba(255, 255, 255, 0.4)", "strokeWidth": 2, "fillStyle": "hachure", "opacity": 1, "cornerRadius": 12 },
      "text": "Step 2", "connectionIds": ["conn_A_to_B"],
      "isSelected": false, "version": 1, "versionNonce": 0.1, "isDeleted": false
    },
    {
      "id": "arrow_A_to_B", "type": "arrow",
      "points": [{"x": 488, "y": 392}, {"x": 619, "y": 392}, {"x": 619, "y": 227}],
      "startPoint": { "x": 488, "y": 392 },
      "endPoint": { "x": 619, "y": 227 },
      "x": 488, "y": 227, "width": 131, "height": 165, "angle": 0,
      "style": { "strokeColor": "#1e1e1e", "backgroundColor": "transparent", "strokeWidth": 2, "fillStyle": "solid", "opacity": 1 },
      "text": "", "connectionIds": [], "connectionId": "conn_A_to_B", "startSide": "right", "endSide": "bottom",
      "isSelected": false, "version": 1, "versionNonce": 0.1, "isDeleted": false
    }
  ],
  "connections": [
    {
      "id": "conn_A_to_B",
      "startElementId": "shape_A",
      "endElementId": "shape_B",
      "arrowElementId": "arrow_A_to_B",
      "startAngle": 0,
      "endAngle": 1.5707963267948966
    }
  ]
}
---
### 5. FINAL REQUIREMENT
You must respond with only the raw JSON object. Do not wrap it in markdown or add comments.
`;

    static generateDiagram = async (userPrompt: string) => {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY environment variable not set.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: {
                role: "system",
                parts: [{ text: this.systemInstruction }],
            },
            generationConfig: {
                temperature: 0.1, // Lower temperature for more deterministic, less "creative" results
                responseMimeType: "application/json", // Enforce JSON output
            }
        });

        const result = await model.generateContent(userPrompt);

        const responseText = result.response.text();
        if (!responseText) {
            throw new Error("Received an empty response from the API.");
        }

        const cleanedJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsedResponse = JSON.parse(cleanedJsonString);

        // Add validation here to ensure the parsed response
        // matches the DiagramResponse interface.

        return parsedResponse;
    }
}

export default DiagramService;