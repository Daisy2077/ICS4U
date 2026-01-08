require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { connectDB } = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const { Types } = mongoose;


function toObjectId(id) {
  if (typeof id !== "string") return null;
  if (!Types.ObjectId.isValid(id)) return null;
  const oid = new Types.ObjectId(id);
  return String(oid) === id ? oid : null;
}


function applyApiIdTransform(schema) {
  const transform = (doc, ret) => {
    
    delete ret.id;

    ret.id = String(ret._id);

   
    delete ret._id;

    return ret;
  };

  schema.set("toJSON", { versionKey: false, transform });
  schema.set("toObject", { versionKey: false, transform });
}

const studentSchema = new mongoose.Schema(
  {
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
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    testName: { type: String, required: true },
    date: { type: String, required: true },
    mark: { type: Number, required: true },
    outOf: { type: Number, required: true },
    weight: { type: Number },
  },
  { versionKey: false }
);


const courseSchema = new mongoose.Schema(
  {
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


applyApiIdTransform(studentSchema);
applyApiIdTransform(courseSchema);

const Student = mongoose.model("Student", studentSchema);
const Course = mongoose.model("Course", courseSchema);



app.get("/", (req, res) => {
  res.json({
    message: "School API is running",
    endpoints: ["/health", "/students", "/courses", "/tests"],
  });
});

app.get("/health", (req, res) => res.json({ ok: true }));



app.get("/students", async (req, res, next) => {
  try {
    const students = await Student.find().sort({ lastName: 1, firstName: 1 }); // NO lean()
    res.json(students.map((s) => s.toJSON()));
  } catch (err) {
    next(err);
  }
});

app.get("/students/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ error: "Student not found" });

    res.json(student.toJSON());
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

    const created = await Student.create({
      firstName: String(firstName),
      lastName: String(lastName),
      grade: Number(grade),
      studentNumber: String(studentNumber),
      homeroom: homeroom === undefined ? undefined : String(homeroom),
    });

    res.status(201).json(created.toJSON());
  } catch (err) {
    next(err);
  }
});

app.put("/students/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const update = { ...req.body };

 
    if (update.grade !== undefined) update.grade = Number(update.grade);
    if (update.studentNumber !== undefined) update.studentNumber = String(update.studentNumber);
    if (update.firstName !== undefined) update.firstName = String(update.firstName);
    if (update.lastName !== undefined) update.lastName = String(update.lastName);
    if (update.homeroom !== undefined) update.homeroom = String(update.homeroom);


    delete update._id;
    delete update.id;

    const updated = await Student.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ error: "Student not found" });
    res.json(updated.toJSON());
  } catch (err) {
    next(err);
  }
});

app.delete("/students/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const exists = await Student.exists({ _id: id });
    if (!exists) return res.status(404).json({ error: "Student not found" });

    const hasTests = await Course.exists({ "tests.studentId": id });
    if (hasTests) {
      return res.status(400).json({ error: "Cannot delete student with existing tests" });
    }

    await Student.deleteOne({ _id: id });
    res.json({ message: "Student deleted" });
  } catch (err) {
    next(err);
  }
});


app.get("/courses", async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ code: 1 }); // NO lean()
    res.json(courses.map((c) => c.toJSON()));
  } catch (err) {
    next(err);
  }
});

app.get("/courses/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });

   
    const out = course.toJSON();
    out.tests = (course.tests || []).map((t) => {
      const obj = t.toObject({ versionKey: false });
      obj.id = String(obj._id);
      delete obj._id;

      obj.studentId = String(obj.studentId);
      return obj;
    });

    res.json(out);
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

    const created = await Course.create({
      code: String(code),
      name: String(name),
      teacherId: teacherId === undefined ? undefined : Number(teacherId),
      semester: String(semester),
      room: String(room),
      schedule: schedule === undefined ? undefined : String(schedule),
      tests: [],
    });

    res.status(201).json(created.toJSON());
  } catch (err) {
    next(err);
  }
});

app.put("/courses/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const update = { ...req.body };

    if (update.code !== undefined) update.code = String(update.code);
    if (update.name !== undefined) update.name = String(update.name);
    if (update.teacherId !== undefined) update.teacherId = Number(update.teacherId);
    if (update.semester !== undefined) update.semester = String(update.semester);
    if (update.room !== undefined) update.room = String(update.room);
    if (update.schedule !== undefined) update.schedule = String(update.schedule);

    delete update._id;
    delete update.id;
    delete update.tests; // don’t allow overwriting tests via this PUT

    const updated = await Course.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ error: "Course not found" });
    res.json(updated.toJSON());
  } catch (err) {
    next(err);
  }
});

app.delete("/courses/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    if ((course.tests || []).length > 0) {
      return res.status(400).json({ error: "Cannot delete course with existing tests" });
    }

    await Course.deleteOne({ _id: id });
    res.json({ message: "Course deleted" });
  } catch (err) {
    next(err);
  }
});

app.get("/tests", async (req, res, next) => {
  try {
    const courses = await Course.find({}, { tests: 1 }); 

    const all = [];
    for (const c of courses) {
      const courseId = String(c._id);
      for (const t of c.tests || []) {
        const obj = t.toObject({ versionKey: false });
        obj.id = String(obj._id);
        delete obj._id;

        obj.studentId = String(obj.studentId);
        obj.courseId = courseId;

        all.push(obj);
      }
    }

    res.json(all);
  } catch (err) {
    next(err);
  }
});

app.get("/tests/:id", async (req, res, next) => {
  try {
    const testId = toObjectId(req.params.id);
    if (!testId) return res.status(400).json({ error: "Invalid id format" });

    const course = await Course.findOne({ "tests._id": testId }, { tests: 1 });
    if (!course) return res.status(404).json({ error: "Test not found" });

    const test = (course.tests || []).find((t) => String(t._id) === String(testId));
    if (!test) return res.status(404).json({ error: "Test not found" });

    const obj = test.toObject({ versionKey: false });
    obj.id = String(obj._id);
    delete obj._id;

    obj.studentId = String(obj.studentId);
    obj.courseId = String(course._id);

    res.json(obj);
  } catch (err) {
    next(err);
  }
});

app.post("/tests", async (req, res, next) => {
  try {
    const { studentId, courseId, testName, date, mark, outOf, weight } = req.body;

    if (!studentId || !courseId || !testName || !date || mark === undefined || outOf === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const sId = toObjectId(String(studentId));
    const cId = toObjectId(String(courseId));
    if (!sId) return res.status(400).json({ error: "Invalid studentId" });
    if (!cId) return res.status(400).json({ error: "Invalid courseId" });

    const studentExists = await Student.exists({ _id: sId });
    if (!studentExists) return res.status(400).json({ error: "Student not found" });

    const course = await Course.findById(cId);
    if (!course) return res.status(400).json({ error: "Course not found" });

    course.tests.push({
      studentId: sId,
      testName: String(testName),
      date: String(date),
      mark: Number(mark),
      outOf: Number(outOf),
      weight: weight === undefined ? undefined : Number(weight),
    });

    await course.save();

    const created = course.tests[course.tests.length - 1];
    const obj = created.toObject({ versionKey: false });
    obj.id = String(obj._id);
    delete obj._id;

    obj.studentId = String(obj.studentId);
    obj.courseId = String(course._id);

    res.status(201).json(obj);
  } catch (err) {
    next(err);
  }
});

app.delete("/tests/:id", async (req, res, next) => {
  try {
    const testId = toObjectId(req.params.id);
    if (!testId) return res.status(400).json({ error: "Invalid id format" });

    const course = await Course.findOne({ "tests._id": testId }, { _id: 1 });
    if (!course) return res.status(404).json({ error: "Test not found" });

    await Course.updateOne({ _id: course._id }, { $pull: { tests: { _id: testId } } });
    res.json({ message: "Test deleted" });
  } catch (err) {
    next(err);
  }
});



app.get("/students/:id/tests", async (req, res, next) => {
  try {
    const studentId = toObjectId(req.params.id);
    if (!studentId) return res.status(400).json({ error: "Invalid id format" });

    const courses = await Course.find({ "tests.studentId": studentId }, { tests: 1 });

    const out = [];
    for (const c of courses) {
      const courseId = String(c._id);
      for (const t of c.tests || []) {
        if (String(t.studentId) === String(studentId)) {
          const obj = t.toObject({ versionKey: false });
          obj.id = String(obj._id);
          delete obj._id;

          obj.studentId = String(obj.studentId);
          obj.courseId = courseId;

          out.push(obj);
        }
      }
    }

    res.json(out);
  } catch (err) {
    next(err);
  }
});

app.get("/courses/:id/tests", async (req, res, next) => {
  try {
    const courseId = toObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ error: "Invalid id format" });

    const course = await Course.findById(courseId, { tests: 1 });
    if (!course) return res.status(404).json({ error: "Course not found" });

    const out = (course.tests || []).map((t) => {
      const obj = t.toObject({ versionKey: false });
      obj.id = String(obj._id);
      delete obj._id;

      obj.studentId = String(obj.studentId);
      obj.courseId = String(course._id);

      return obj;
    });

    res.json(out);
  } catch (err) {
    next(err);
  }
});

app.get("/students/:id/average", async (req, res, next) => {
  try {
    const studentId = toObjectId(req.params.id);
    if (!studentId) return res.status(400).json({ error: "Invalid id format" });

    const courses = await Course.find({ "tests.studentId": studentId }, { tests: 1 });

    const tests = [];
    for (const c of courses) {
      for (const t of c.tests || []) {
        if (String(t.studentId) === String(studentId)) tests.push(t);
      }
    }

    if (tests.length === 0) return res.json({ average: 0 });

    const avg = tests.reduce((acc, x) => acc + (Number(x.mark) / Number(x.outOf)) * 100, 0) / tests.length;
    res.json({ average: Number(avg.toFixed(2)) });
  } catch (err) {
    next(err);
  }
});


app.post("/admin/cleanup-legacy-ids", async (req, res, next) => {
  try {
    const s = await Student.updateMany({}, { $unset: { id: "" } });
    const c = await Course.updateMany({}, { $unset: { id: "" } });
    res.json({
      studentsModified: s.modifiedCount ?? s.nModified ?? 0,
      coursesModified: c.modifiedCount ?? c.nModified ?? 0,
      message: "Legacy numeric id fields removed (if they existed).",
    });
  } catch (err) {
    next(err);
  }
});


app.use((err, req, res, next) => {
  console.error(err);
  const status = err?.name === "ValidationError" ? 400 : 500;
  res.status(status).json({ error: err?.message || "Internal Server Error" });
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
