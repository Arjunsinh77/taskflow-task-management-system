const express = require("express");
const path = require("path");
const app = express();

const userModel = require('./models/user')
const taskModel = require('./models/task')

const cookieParser = require('cookie-parser');

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', function (req, res) {
    res.render("login")
})

app.get('/sign', function (req, res) {
    res.render("sign")
})


app.post("/signup", async (req, res) => {

    let { username, email, password } = req.body;

    let user = await userModel.findOne({ email });

    if (user) return res.send("User already exists");

    bcrypt.genSalt(10, (err, salt) => {

        bcrypt.hash(password, salt, async (err, hash) => {

            let newUser = await userModel.create({
                username,
                email,
                password: hash
            });

            const token = jwt.sign(
                { id: newUser._id, email: newUser.email },
                "secret"
            );
            res.cookie("token", token);

            res.redirect("/dashboard");

        });

    });

})


app.post("/login", async (req, res) => {

    let { email, password } = req.body;

    let user = await userModel.findOne({ email });

    if (!user) return res.send("User not found");

    bcrypt.compare(password, user.password, (err, result) => {

        if (result) {

            const token = jwt.sign(
                { id: user._id, email: user.email },
                "secret"
            );

            res.cookie("token", token);

            res.redirect("/dashboard");

        }
        else {
            res.send("Wrong Password");
        }

    });

});


app.get("/dashboard", isLoggedIn, async (req, res) => {

    let tasks = await taskModel.find({
        userId: req.user.id
    });
    res.render("dashboard", { tasks });

});

app.post("/create", isLoggedIn, async (req, res) => {
    let { title, description } = req.body;
    await taskModel.create({
        title,
        description,
        userId: req.user.id
    })
    res.redirect("/dashboard");
})

app.get("/read/:id", isLoggedIn, async (req, res) => {
  
    let task = await taskModel.findById(req.params.id);

    res.render("show", { task });

});

app.get("/edit/:id", async (req, res) => {

    let task = await taskModel.findById(req.params.id);

    res.render("edit", { task });
})

app.get("/delete/:id", async (req, res) => {

    let deleteuser = await taskModel.deleteOne({ _id: req.params.id });
    res.redirect("/dashboard");
})



app.post("/edit/:id", isLoggedIn, async (req, res) => {

    let { title, description } = req.body;

    await taskModel.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        { title, description }
    );

    res.redirect("/dashboard");

});

app.get("/logout",(req,res)=>{
    res.cookie("token","");
    res.redirect("/");
});


// middlware
function isLoggedIn(req, res, next) {

    if (!req.cookies.token) return res.redirect("/");

    try {
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
        next();
    }
    catch (err) {
        res.redirect("/")
    }

}

app.listen(3000, function (req, err) {
    console.log("server started..")
});