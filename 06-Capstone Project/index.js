import express from "express";
import bodyParser from "body-parser";
import axios from "axios"
import pg from "pg"

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Stored Books",
    password: "bondelucas77",
    port: 5432
})
db.connect()

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let listBooks = []

app.get("/addBook", async (req, res) => {
    res.render('addBook.ejs')
})

app.get("/editBook", async (req, res) => {
    res.render('editBook.ejs')
})

app.get("/back", async (req, res) => {
    res.redirect('/')
})

app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM books ORDER BY id ASC");

        listBooks = await Promise.all(result.rows.map(async (book) => {
            const searchBook = await axios.get(`https://openlibrary.org/search.json?title=${book.title}`);
            const isbn = searchBook.data.docs.length > 0 ? searchBook.data.docs[0].isbn[0] : 'ISBN não encontrado';
            return {
                ...book,
                isbn: isbn
            };
        }));

        res.render('index.ejs', {
            listBooks: listBooks
        })
    } catch (err) {
        console.log(err)
    }
})

app.post("/add", async (req, res) => {
    const title = req.body.title
    const description = req.body.description

    try {
        const result = await db.query(
            "INSERT INTO books (title, description) VALUES ($1, $2)", [title, description]
        )
        res.redirect('/')
    } catch (err) {
        console.log(err)
    }
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});