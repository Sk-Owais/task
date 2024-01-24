let express = require('express')
let app = express()
let joi = require('joi')
let { Sequelize, Model, DataTypes, QueryTypes, Op } = require('sequelize')
let sequelizeCon = new Sequelize('Mysql://root:root@localhost/task')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

sequelizeCon.authenticate().then(() => {
    console.log("Connected")
}).catch((error) => {
    console.log("Not connected", error)
})

//category schema
class Category extends Model { }
Category.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    cname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: false
    }
}, { tableName: 'category', modelName: 'Category', sequelize: sequelizeCon })

//product schema
class Product extends Model { }
Product.init({
    id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
    },
    categoryID: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, { tableName: 'product', modelName: 'Product', sequelize: sequelizeCon })

//create category joi validation
async function checkCategory(data) {
    let schema = joi.object({
        cname: joi.string().required(),
        description: joi.string().required()
    })
    let valid = await schema.validateAsync(data, { abortEarly: false }).catch((error) => { return { error } })
    if (!valid || (valid && valid.error)) {
        let msg = []
        for (let i of valid.error.details) {
            msg.push(i.message)
        }
        return { error: msg }
    }
    return { data:valid.data }
}

//create category
app.post('/category/add', async (req, res) => {
    let valid = await checkCategory(req.body).catch((error) => { return { error } })
    if (!valid || (valid && valid.error)) {
        return res.send({ error: valid.error })
    }
    let find = await Category.findOne({ where: { cname: req.body.cname } }).catch((error) => { return { error } })
    if (find || (find && find.error)) {
        return res.send({ error: 'Category already exist' })
    }
    let data = await Category.create(req.body).catch((error) => { return { error } })
    if (!data || (data && data.error)) {
        return res.send({ error: 'failed to create category' })
    }
    return res.send({ data })
})

//get all categories
app.get('/category/all', async (req, res) => {
    let data = await Category.findAll().catch((error) => { return { error } })
    if (!data || (data && data.error)) {
        return res.send({ error: "Unable to get all category" })
    }
    return res.send({ data })
})

//create product joi validation
async function checkCreate(data) {
    let schema = joi.object({
        name: joi.string().required(),
        price: joi.number().required(),
        description: joi.string().required(),
        categoryID: joi.number().required()
    })
    let valid = await schema.validateAsync(data, { abortEarly: false }).catch((error) => { return { error } })
    if (!valid || (valid && valid.error)) {
        let msg = []
        for (let i of valid.error.details) {
            msg.push(i.message)
        }
        return { error: msg }
    }
    return { data:valid.data }
}

//product create
app.post('/product/add', async (req, res) => {
    let valid = await checkCreate(req.body).catch((error) => { return { error } })
    if (!valid || (valid && valid.error)) {
        return res.send({ error: valid.error })
    }
    let productData = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        categoryID: req.body.categoryID,
        slug: req.body.name
    }
    let findProduct = await Product.findOne({ where: { slug: productData.slug } }).catch((error) => { return { error } })
    if (findProduct) {
        productData.slug = findProduct.slug + '-' + 1
    }
    let data = await Product.create(productData).catch((error) => { return { error } })
    if (!data || (data && data.error)) {
        return res.send({ error: 'failed to create product' })
    }
    return res.send({ data })
})

//product get
app.get('/product/:getByHandle', async (req, res) => {
    let data = await Product.findOne({ where: { slug: req.params.getByHandle } }).catch((error) => { return { error } })
    if (!data || (data && data.error)) {
        return res.send({ error: "Cant get product" })
    }
    return res.send({ data })
})

//product update joi validation
async function checkUpdate(data) {
    let schema = joi.object({
        name: joi.string(),
        price: joi.number(),
        description: joi.string(),
        categoryID: joi.number()
    })
    let valid = await schema.validateAsync(data, { abortEarly: false }).catch((error) => { return { error } })
    if (!valid || (valid && valid.error)) {
        let msg = []
        for (let i of valid.error.details) {
            msg.push(i.message)
        }
        return { error: msg }
    }
    return { data:valid.data }
}

//product update
app.put('/product/update/:productID', async (req, res) => {
    let valid = await checkUpdate(req.body).catch((error) => { return { error } })
    if (!valid || (valid && valid.error)) {
        return res.send({ error: valid.error })
    }
    let find = await Product.findOne({ where: { id: req.params.productID } }).catch((error) => { return { error } })
    if (!find || (find && find.error)) {
        return res.send({ error: 'Product not exist' })
    }
    let data = await Product.update(req.body, { where: { id: req.params.productID } }).catch((error) => { return { error } })
    console.log("🚀 ~ app.put ~ data:", data)
    if (!data || (data && data.error)) {
        return res.send({ error: 'failed to update product' })
    }
    return res.send({ data: "Product Updated" })
})

//product delete
app.delete('/product/delete/:id', async (req, res) => {
    let find = await Product.findOne({ where: { id: req.params.id } }).catch((error) => { return { error } })
    if (!find || (find && find.error)) {
        return res.send({ error: "Product not found" })
    }
    let data = await Product.destroy({ where: { id: find.id } }).catch((error) => { return { error } })
    if (!data || (data && data.error)) {
        return res.send({ error: "Cant delete product" })
    }
    return res.send({ data: "Product deleted" })
})

//get all products
app.get('/product', async (req, res) => {
    let limit = (req.params.limit) ? parseInt(req.params.limit) : 10;
    let page = (req.params.page) ? parseInt(req.params.page) : 1;
    let offset = (page - 1) * limit
    let counter = await Product.count().catch((error) => {
        return { error }
    })
    if (!counter || (counter && counter.error)) {
        return res.send({ error: 'Internal Server Error' })
    }
    if (counter <= 0) {
        return res.send({ error: 'No products found' })
    }
    let pdata = await Product.findAll({ limit, offset, raw: true }).catch((error) => {
        return { error }
    })
    if (!pdata || (pdata && pdata.error)) {
        return res.send({ error: 'internal server error' })
    }
    let query = `select product.id,product.name,product.price,product.description,product.slug,category.cname
        from product
        left join category
        on product.categoryID=category.id`
    let join = await sequelizeCon.query(query, { type: QueryTypes.SELECT }).catch((error) => {
        return { error }
    })
    return res.send({ data: join, total: counter, page, limit })
})

//multiple product create
app.post('/product/addProduct', async (req, res) => {
    let data = await Product.bulkCreate(req.body).catch((error) => { return { error } })
    if (!data || (data && data.error)) {
        return res.send({ error: "Unable to add" });
    }
    return res.send({ product: data })
})

app.listen(3011, () => {
    console.log('Db Connected');
})