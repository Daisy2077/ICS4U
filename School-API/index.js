require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");

const mongoose = require("mongoose"); 

const app = express();
app.use(cors());
app.use(express.json());


const studentSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    grade: { type: Number, required: true },
    studentNumber: { type: String, required: true },
    homeroom: { type: String },
  },
  { versionKey: false }
);

const testSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    studentId: { type: Number, required: true },
    testName: { type: String, required: true },
    date: { type: String, required: true },
    mark: { type: Number, required: true },
    outOf: { type: Number, required: true },
    weight: { type: Number },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    teacherId: { type: Number },
    semester: { type: String, required: true },
    room: { type: String, required: true },
    schedule: { type: String },
    tests: { type: [testSchema], default: [] },
  },
  { versionKey: false }
);

const Student = mongoose.model("Student", studentSchema);
const Course = mongoose.model("Course", courseSchema);

async function getNextId(Model) {
  const last = await Model.findOne().sort({ id: -1 }).lean();
  return last ? last.id + 1 : 1;
}

async function getNextTestId() {
  const courses = await Course.find({}, { tests: 1 }).lean();
  let max = 0;
  for (const c of courses) {
    for (const t of c.tests || []) {
      if (typeof t.id === "number" && t.id > max) max = t.id;
    }
  }
  return max + 1;
}


app.get("/", (req, res) => {
  res.json({
    message: "School API is running",
    endpoints: ["/health", "/students", "/courses", "/tests"],
  });
});

app.get("/health", (req, res) => res.json({ ok: true }));


app.get("/students", async (req, res, next) => {
  try {
    const students = await Student.find().sort({ id: 1 }).lean();
    res.json(students);
  } catch (err) {
    next(err);
  }
});

app.get("/students/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const student = await Student.findOne({ id }).lean();
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    next(err);
  }
});

app.post("/students", async (req, res, next) => {
  try {
    const { firstName, lastName, grade, studentNumber, homeroom } = req.body;
    if (!firstName || !lastName || grade === undefined || !studentNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = await getNextId(Student);
    const created = await Student.create({
      id,
      firstName,
      lastName,
      grade: Number(grade),
      studentNumber: String(studentNumber),
      homeroom,
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

app.put("/students/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const update = { ...req.body };
    if (update.grade !== undefined) update.grade = Number(update.grade);
    if (update.studentNumber !== undefined)
      update.studentNumber = String(update.studentNumber);

    const updated = await Student.findOneAndUpdate({ id }, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) return res.status(404).json({ error: "Student not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.delete("/students/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const hasTests = await Course.exists({ "tests.studentId": id });
    if (hasTests)
      return res
        .status(400)
        .json({ error: "Cannot delete student with existing tests" });

    const deleted = await Student.findOneAndDelete({ id }).lean();
    if (!deleted) return res.status(404).json({ error: "Student not found" });

    res.json({ message: "Student deleted" });
  } catch (err) {
    next(err);
  }
});


app.get("/courses", async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ id: 1 }).lean();
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

app.get("/courses/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const course = await Course.findOne({ id }).lean();
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    next(err);
  }
});

app.post("/courses", async (req, res, next) => {
  try {
    const { code, name, teacherId, semester, room, schedule } = req.body;

    if (!code || !name || semester === undefined || !room) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const id = await getNextId(Course);
    const created = await Course.create({
      id,
      code: String(code),
      name: String(name),
      teacherId: teacherId === undefined ? undefined : Number(teacherId),
      semester: String(semester),
      room: String(room),
      schedule: schedule === undefined ? undefined : String(schedule),
      tests: [],
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

app.put("/courses/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const update = { ...req.body };
    if (update.teacherId !== undefined) update.teacherId = Number(update.teacherId);

    const updated = await Course.findOneAndUpdate({ id }, update, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) return res.status(404).json({ error: "Course not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.delete("/courses/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const course = await Course.findOne({ id }).lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    if ((course.tests || []).length > 0) {
      return res.status(400).json({ error: "Cannot delete course with existing tests" });
    }

    await Course.deleteOne({ id });
    res.json({ message: "Course deleted" });
  } catch (err) {
    next(err);
  }
});


app.get("/tests", async (req, res, next) => {
  try {
    const courses = await Course.find({}, { tests: 1, id: 1 }).lean();
    const all = [];
    for (const c of courses) {
      for (const t of c.tests || []) {
        all.push({ ...t, courseId: c.id });
      }
    }
    all.sort((a, b) => a.id - b.id);
    res.json(all);
  } catch (err) {
    next(err);
  }
});

app.get("/tests/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const course = await Course.findOne({ "tests.id": id }, { tests: 1, id: 1 }).lean();
    if (!course) return res.status(404).json({ error: "Test not found" });

    const test = (course.tests || []).find((t) => t.id === id);
    res.json({ ...test, courseId: course.id });
  } catch (err) {
    next(err);
  }
});

app.post("/tests", async (req, res, next) => {
  try {
    const { studentId, courseId, testName, date, mark, outOf, weight } = req.body;

    if (
      studentId === undefined ||
      courseId === undefined ||
      !testName ||
      !date ||
      mark === undefined ||
      outOf === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sId = Number(studentId);
    const cId = Number(courseId);

    const studentExists = await Student.exists({ id: sId });
    if (!studentExists) return res.status(400).json({ error: "Invalid studentId" });

    const courseExists = await Course.exists({ id: cId });
    if (!courseExists) return res.status(400).json({ error: "Invalid courseId" });

    const testId = await getNextTestId();

    const newTest = {
      id: testId,
      studentId: sId,
      testName: String(testName),
      date: String(date),
      mark: Number(mark),
      outOf: Number(outOf),
      weight: weight === undefined ? undefined : Number(weight),
    };

    const result = await Course.updateOne({ id: cId }, { $push: { tests: newTest } });

  
    if (result.modifiedCount !== 1) {
      return res.status(500).json({ error: "Failed to add test to course" });
    }

    res.status(201).json({ ...newTest, courseId: cId });
  } catch (err) {
    next(err);
  }
});

app.delete("/tests/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const course = await Course.findOne({ "tests.id": id }, { id: 1 }).lean();
    if (!course) return res.status(404).json({ error: "Test not found" });

    await Course.updateOne({ id: course.id }, { $pull: { tests: { id } } });
    res.json({ message: "Test deleted" });
  } catch (err) {
    next(err);
  }
});

app.get("/students/:id/tests", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const courses = await Course.find({ "tests.studentId": id }, { tests: 1, id: 1 }).lean();
    const out = [];
    for (const c of courses) {
      for (const t of c.tests || []) {
        if (t.studentId === id) out.push({ ...t, courseId: c.id });
      }
    }
    out.sort((a, b) => a.id - b.id);
    res.json(out);
  } catch (err) {
    next(err);
  }
});

app.get("/courses/:id/tests", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const course = await Course.findOne({ id }, { tests: 1, id: 1 }).lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    const out = (course.tests || []).map((t) => ({ ...t, courseId: course.id }));
    out.sort((a, b) => a.id - b.id);
    res.json(out);
  } catch (err) {
    next(err);
  }
});

app.get("/students/:id/average", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    const courses = await Course.find({ "tests.studentId": id }, { tests: 1 }).lean();
    const studentTests = [];
    for (const c of courses) {
      for (const t of c.tests || []) {
        if (t.studentId === id) studentTests.push(t);
      }
    }

    if (studentTests.length === 0) return res.json({ average: 0 });

    const avg =
      studentTests.reduce((acc, x) => acc + (x.mark / x.outOf) * 100, 0) /
      studentTests.length;

    res.json({ average: Number(avg.toFixed(2)) });
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.name === "ValidationError" ? 400 : 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
  });
});
const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });
