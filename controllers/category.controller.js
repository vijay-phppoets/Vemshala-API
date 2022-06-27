const { response } = require("express");
const Category = require("../models/category.model");
const s3Controller = require("./s3.controller");

const { list_to_tree } = require('../utils')

/* ----
Purpose: To fetch category info
Req: category_url_key
Res: 
---- */
exports.details = async (req, res) => {

    // Collecting params
    let category_url_key = req.query.category_url_key || "";


    /* START: Validating params */
    if (!category_url_key) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let [category, category_children] = await Promise.all([
            Category.details(category_url_key),
            Category.children(category_url_key),
        ])
        if (response) {
            return res.status(200).send({
                status: "success",
                message: "category info",
                category: category,
                children: category_children
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};


/* ----
Purpose: To fetch category tree
Req: 
Res: array (tree)
---- */
exports.tree = async (req, res) => {
    try {
        let categoryFlatList = await Category.flatList()


        if (response) {
            return res.status(200).send({
                status: "success",
                message: "category info",
                tree: list_to_tree(categoryFlatList),
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

/* ----
Purpose: To create category
Req: 
Res: 
---- */
exports.create = async (req, res) => {

    // Collecting params
    let parent_category_id = req.body.parent_category_id || null;
    let name = req.body.name || "";
    let url_key = req.body.url_key || "";
    let image = req.body.image || "";
    let banner_img = req.body.banner_img || "";
    let m_banner_img = req.body.m_banner_img || "";


    /* START: Validating params */
    if (!name || !url_key || !image || !banner_img || !m_banner_img) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let obj = {
            parent_category_id: parent_category_id,
            name: name,
            url_key: url_key,
            image: image,
            banner_img: banner_img,
            m_banner_img: m_banner_img,
        }

        let parent_category = null
        if (parent_category_id) {
            parent_category = await Category.detail_by_id(parent_category_id)
        }
        let category = await Category.create(obj, parent_category)

        return res.status(200).send({
            status: "success",
            message: "Category created successfully.",
            category: category
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To update category
Req: 
Res: 
---- */
exports.update = async (req, res) => {

    // Collecting params
    let category_id = req.body.category_id || null;
    let parent_category_id = req.body.parent_category_id || null;
    let name = req.body.name || "";
    let url_key = req.body.url_key || "";
    let image = req.body.image || "";
    let banner_img = req.body.banner_img || "";
    let m_banner_img = req.body.m_banner_img || "";
    let imgChanged = req.body.imgChanged || null;


    /* START: Validating params */
    if (!category_id || !name || !url_key || !image || !banner_img || !m_banner_img) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let obj = {
            category_id: category_id,
            parent_category_id: parent_category_id,
            name: name,
            url_key: url_key,
            image: image,
            banner_img: banner_img,
            m_banner_img: m_banner_img,
        }

        // getting current category details
        let category = await Category.detail_by_id(category_id)


        // deleting old images
        if (imgChanged.image) await s3Controller.deleteFile(category.image);
        if (imgChanged.banner_img) await s3Controller.deleteFile(category.banner_img);
        if (imgChanged.m_banner_img) await s3Controller.deleteFile(category.m_banner_img);

        let parent_category = null
        if (parent_category_id) {
            parent_category = await Category.detail_by_id(parent_category_id)
        }

        let updated_category = await Category.update(obj, parent_category)

        return res.status(200).send({
            status: "success",
            message: "Category updated successfully.",
            category: updated_category
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To fetch category view
Req: 
Res: obj
---- */
exports.view = async (req, res) => {
    // Collecting params
    let category_id = req.query.category_id || null;

    /* START: Validating params */
    if (!category_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let category = await Category.detail_by_id(category_id)

        if (category) {
            return res.status(200).send({
                status: "success",
                message: "category info",
                category: category,
            });
        } else {
            return res.status(500).send({
                status: "error",
                message: "category not found.",
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

/* ----
Purpose: To delete category
Req: category_id
Res: 
---- */
exports.delete = async (req, res) => {

    // Collecting params
    let category_id = req.body.category_id || "";


    /* START: Validating params */
    if (!category_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        /* 
        get all children 
        delete s3 images of children
        delete all children
        */
        let category = await Category.detail_by_id(category_id)
        let category_children = await Category.get_children(category)

        // deleting S3 images and record
        let promises = category_children.map(async child_cat => {
            await s3Controller.deleteFile(child_cat.image);
            await s3Controller.deleteFile(child_cat.banner_img);
            await s3Controller.deleteFile(child_cat.m_banner_img);

            await Category.delete(child_cat.id)
        })
        await Promise.all(promises)

        await s3Controller.deleteFile(category.image);
        await s3Controller.deleteFile(category.banner_img);
        await s3Controller.deleteFile(category.m_banner_img);
        await Category.delete(category.id)


        return res.status(200).send({
            status: "success",
            message: "category deleted successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};