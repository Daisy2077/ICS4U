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


const teacherSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    employeeNumber: { type: String },
    email: { type: String },
    department: { type: String },
    room: { type: String },
  },
  { versionKey: false }
);

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

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Teacher" },
    semester: { type: String, required: true },
    room: { type: String, required: true },
    schedule: { type: String },
  },
  { versionKey: false }
);

const testSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Student" },
    courseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Course" },
    testName: { type: String, required: true },
    date: { type: String, required: true },
    mark: { type: Number, required: true },
    outOf: { type: Number, required: true },
    weight: { type: Number },
  },
  { versionKey: false }
);

applyApiIdTransform(teacherSchema);
applyApiIdTransform(studentSchema);
applyApiIdTransform(courseSchema);
applyApiIdTransform(testSchema);

const Teacher = mongoose.model("Teacher", teacherSchema);
const Student = mongoose.model("Student", studentSchema);
const Course = mongoose.model("Course", courseSchema);
const Test = mongoose.model("Test", testSchema);


app.get("/", (req, res) => {
  res.json({
    message: "School API is running",
    endpoints: ["/teachers", "/students", "/courses", "/tests"],
  });
});


app.get("/teachers", async (req, res, next) => {
  try {
    const teachers = await Teacher.find().sort({ lastName: 1, firstName: 1 });
    res.json(teachers.map((t) => t.toJSON()));
  } catch (err) {
    next(err);
  }
});

app.get("/teachers/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });

    res.json(teacher.toJSON());
  } catch (err) {
    next(err);
  }
});

app.post("/teachers", async (req, res, next) => {
  try {
    const { firstName, lastName, employeeNumber, email, department, room } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const created = await Teacher.create({
      firstName: String(firstName),
      lastName: String(lastName),
      employeeNumber: employeeNumber === undefined ? undefined : String(employeeNumber),
      email: email === undefined ? undefined : String(email),
      department: department === undefined ? undefined : String(department),
      room: room === undefined ? undefined : String(room),
    });

    res.status(201).json(created.toJSON());
  } catch (err) {
    next(err);
  }
});

app.put("/teachers/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const update = { ...req.body };
    if (update.firstName !== undefined) update.firstName = String(update.firstName);
    if (update.lastName !== undefined) update.lastName = String(update.lastName);
    if (update.employeeNumber !== undefined) update.employeeNumber = String(update.employeeNumber);
    if (update.email !== undefined) update.email = String(update.email);
    if (update.department !== undefined) update.department = String(update.department);
    if (update.room !== undefined) update.room = String(update.room);

    delete update._id;
    delete update.id;

    const updated = await Teacher.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ error: "Teacher not found" });
    res.json(updated.toJSON());
  } catch (err) {
    next(err);
  }
});

app.delete("/teachers/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const exists = await Teacher.exists({ _id: id });
    if (!exists) return res.status(404).json({ error: "Teacher not found" });

    const teaching = await Course.exists({ teacherId: id });
    if (teaching) {
      return res.status(400).json({ error: "Cannot delete teacher assigned to courses" });
    }

    await Teacher.deleteOne({ _id: id });
    res.json({ message: "Teacher deleted" });
  } catch (err) {
    next(err);
  }
});

app.get("/students", async (req, res, next) => {
  try {
    const students = await Student.find().sort({ lastName: 1, firstName: 1 });
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

    const hasTests = await Test.exists({ studentId: id });
    if (hasTests) return res.status(400).json({ error: "Cannot delete student with existing tests" });

    await Student.deleteOne({ _id: id });
    res.json({ message: "Student deleted" });
  } catch (err) {
    next(err);
  }
});


app.get("/courses", async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ code: 1 });
    res.json(courses.map((c) => {
      const obj = c.toJSON();
      obj.teacherId = String(c.teacherId);
      return obj;
    }));
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

    const obj = course.toJSON();
    obj.teacherId = String(course.teacherId);

    res.json(obj);
  } catch (err) {
    next(err);
  }
});

app.post("/courses", async (req, res, next) => {
  try {
    const { code, name, teacherId, semester, room, schedule } = req.body;

    if (!code || !name || !teacherId || semester === undefined || !room) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const tId = toObjectId(String(teacherId));
    if (!tId) return res.status(400).json({ error: "Invalid teacherId" });

    const teacherExists = await Teacher.exists({ _id: tId });
    if (!teacherExists) return res.status(400).json({ error: "Teacher not found" });

    const created = await Course.create({
      code: String(code),
      name: String(name),
      teacherId: tId,
      semester: String(semester),
      room: String(room),
      schedule: schedule === undefined ? undefined : String(schedule),
    });

    const obj = created.toJSON();
    obj.teacherId = String(created.teacherId);

    res.status(201).json(obj);
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
    if (update.semester !== undefined) update.semester = String(update.semester);
    if (update.room !== undefined) update.room = String(update.room);
    if (update.schedule !== undefined) update.schedule = String(update.schedule);

    if (update.teacherId !== undefined) {
      const tId = toObjectId(String(update.teacherId));
      if (!tId) return res.status(400).json({ error: "Invalid teacherId" });

      const teacherExists = await Teacher.exists({ _id: tId });
      if (!teacherExists) return res.status(400).json({ error: "Teacher not found" });

      update.teacherId = tId;
    }

    delete update._id;
    delete update.id;

    const updated = await Course.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ error: "Course not found" });

    const obj = updated.toJSON();
    obj.teacherId = String(updated.teacherId);

    res.json(obj);
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

    const hasTests = await Test.exists({ courseId: id });
    if (hasTests) return res.status(400).json({ error: "Cannot delete course with existing tests" });

    await Course.deleteOne({ _id: id });
    res.json({ message: "Course deleted" });
  } catch (err) {
    next(err);
  }
});


app.get("/tests", async (req, res, next) => {
  try {
    const tests = await Test.find().sort({ date: 1 });

    res.json(tests.map((t) => {
      const obj = t.toJSON();
      obj.studentId = String(t.studentId);
      obj.courseId = String(t.courseId);
      return obj;
    }));
  } catch (err) {
    next(err);
  }
});

app.get("/tests/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ error: "Test not found" });

    const obj = test.toJSON();
    obj.studentId = String(test.studentId);
    obj.courseId = String(test.courseId);

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

    const courseExists = await Course.exists({ _id: cId });
    if (!courseExists) return res.status(400).json({ error: "Course not found" });

    const created = await Test.create({
      studentId: sId,
      courseId: cId,
      testName: String(testName),
      date: String(date),
      mark: Number(mark),
      outOf: Number(outOf),
      weight: weight === undefined ? undefined : Number(weight),
    });

    const obj = created.toJSON();
    obj.studentId = String(created.studentId);
    obj.courseId = String(created.courseId);

    res.status(201).json(obj);
  } catch (err) {
    next(err);
  }
});

app.delete("/tests/:id", async (req, res, next) => {
  try {
    const id = toObjectId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id format" });

    const exists = await Test.exists({ _id: id });
    if (!exists) return res.status(404).json({ error: "Test not found" });

    await Test.deleteOne({ _id: id });
    res.json({ message: "Test deleted" });
  } catch (err) {
    next(err);
  }
});

app.get("/students/:id/tests", async (req, res, next) => {
  try {
    const studentId = toObjectId(req.params.id);
    if (!studentId) return res.status(400).json({ error: "Invalid id format" });

    const tests = await Test.find({ studentId }).sort({ date: 1 });
    res.json(tests.map((t) => {
      const obj = t.toJSON();
      obj.studentId = String(t.studentId);
      obj.courseId = String(t.courseId);
      return obj;
    }));
  } catch (err) {
    next(err);
  }
});

app.get("/courses/:id/tests", async (req, res, next) => {
  try {
    const courseId = toObjectId(req.params.id);
    if (!courseId) return res.status(400).json({ error: "Invalid id format" });

    const exists = await Course.exists({ _id: courseId });
    if (!exists) return res.status(404).json({ error: "Course not found" });

    const tests = await Test.find({ courseId }).sort({ date: 1 });
    res.json(tests.map((t) => {
      const obj = t.toJSON();
      obj.studentId = String(t.studentId);
      obj.courseId = String(t.courseId);
      return obj;
    }));
  } catch (err) {
    next(err);
  }
});

app.get("/students/:id/average", async (req, res, next) => {
  try {
    const studentId = toObjectId(req.params.id);
    if (!studentId) return res.status(400).json({ error: "Invalid id format" });

    const tests = await Test.find({ studentId });
    if (tests.length === 0) return res.json({ average: 0 });

    const avg = tests.reduce((acc, x) => acc + (Number(x.mark) / Number(x.outOf)) * 100, 0) / tests.length;
    res.json({ average: Number(avg.toFixed(2)) });
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
