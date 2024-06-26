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
let listEditBooks = []

app.get("/addBook", async (req, res) => {
    res.render('addBook.ejs')
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
        await db.query(
            "INSERT INTO books (title, description) VALUES ($1, $2)", [title, description]
        )
        res.redirect('/')
    } catch (err) {
        console.log(err)
    }
})

app.post("/delete", async (req, res) => {
    const id = req.body.deleteBookId

    try {
        await db.query("DELETE FROM books WHERE id = $1", [id])
        res.redirect('/')
    } catch (err) {
        console.log(err)
    }
})

app.get("/editBook", async (req, res) => {
    const id = req.query.editBookId

    try {
        const result = await db.query("SELECT * FROM books WHERE id = $1", [id])
        listEditBooks = result.rows
        console.log(result)

        res.render('editBook.ejs', {
            editBook: listEditBooks
        })
    } catch(err) {
        console.log(err)
    }
})

app.post("/edit", async (req, res) => {
    const id = req.body.bookId
    const title = req.body.editTitle
    const description = req.body.editDescription

    try {
        await db.query("UPDATE books SET title = ($1), description = ($2) WHERE id = $3", [title, description, id])
        res.redirect('/')
    } catch (err) {
        console.log(err)
    }
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});