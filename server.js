require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;


const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

// middleware
app.use(cors(corsOptions));
app.use(express.json());

// connect mongodb to express
const uri = process.env.DATABASE_URL;

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3iohovs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    // database collection name
    const database = client.db("drawingsDatabase");
    const drawingsCollection = database.collection("drawings");

    // create new drawing and post mongodb
    app.post("/drawings", async (req, res) => {
      try {
        const { title, description, elements } = req.body;
        if (!title || !description || !elements) {
          return res
            .status(400)
            .send({ message: "Title, description, and elements are required" });
        }
        const drawing = {
          title,
          description,
          elements,
          createdAt: new Date(),
        };
        const result = await drawingsCollection.insertOne(drawing);
        res.status(201).send({ _id: result.insertedId, ...drawing });
      } catch (error) {
        console.error("Error saving drawing:", error);
        res.status(500).send({ message: "Internal Server Error", error });
      }
    });

    // Get all drawings Which I created earlier
    app.get("/drawings", async (req, res) => {
      const drawings = await drawingsCollection.find().toArray();
      res.send(drawings);
    });

    // get drawing specific id ways from database
    app.get("/drawings/:id", async (req, res) => {
      try {
        const drawingId = req.params.id;
        if (!ObjectId.isValid(drawingId)) {
          return res.status(400).send("Invalid drawing ID");
        }

        const drawing = await drawingsCollection.findOne({
          _id: new ObjectId(drawingId),
        });

        if (!drawing) {
          return res.status(404).send("Drawing not found");
        }

        res.send(drawing);
      } catch (error) {
        console.error("Error retrieving drawing:", error);
        res.status(500).send("An error occurred while retrieving the drawing");
      }
    });

    // Update a drawing
    app.put("/drawings/:id", async (req, res) => {
      try {
        const drawingId = req.params.id;
        const updateData = req.body;

        const result = await drawingsCollection.updateOne(
          { _id: new ObjectId(drawingId) },
          { $set: updateData }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: "Drawing not found" });
        }
        res.json({ message: "Drawing updated successfully" });
      } catch (error) {
        console.error("Error updating drawing:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    // Delete a drawing
    app.delete("/drawings/:id", async (req, res) => {
      try {
        const drawingId = req.params.id;
        const deletedDrawing = await drawingsCollection.deleteOne({
          _id: new ObjectId(drawingId),
        });

        if (deletedDrawing.deletedCount === 0) {
          return res.status(404).send({ message: "Drawing not found" });
        }

        res.send({
          message: "Drawing deleted successfully",
          drawingId: drawingId,
        });
      } catch (error) {
        console.error("Error deleting drawing:", error);
        res.status(500).send({ message: "Error deleting drawing" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Ontic Server is running");
});

app.listen(port, () => {
  console.log(`Ontic Server is running on port ${port}`);
});
