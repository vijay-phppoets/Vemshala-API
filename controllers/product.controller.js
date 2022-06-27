const { response } = require("express");
const Product = require("../models/product.model");
const Category = require("../models/category.model");
const Wishlist = require('../models/wishlist.model')
const Setting = require('../models/setting.model')
const _ = require('lodash');

const s3Controller = require("./s3.controller");

/* ----
Purpose: To get list 
Req: name, parent_id
Res: 
---- */
exports.list = async (req, res) => {
    // Collecting params
    let search_query = req.query.search_query || null;
    let category_url_key = req.query.category_url_key || null;
    let page = req.query.page || 1;
    let records = req.query.records || 20;
    let sort_key = req.query.sort_key || "";
    let filter_params = JSON.parse(req.query.filter_params) || {};
    let attr_filter_params = JSON.parse(req.query.attr_filter_params) || {};
    let currencyType = req.query.currencyType || null;

    /* START: Validating params */
    if (!search_query && !category_url_key) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let obj = {
            search_query: search_query,
            category_url_key: category_url_key,
            page: page,
            records: records,
            sort_key: sort_key,
            filter_params: filter_params,
            attr_filter_params: attr_filter_params,
        }
        if (!search_query) {
            let category = await Category.detail_by_url_key(category_url_key)
            obj.category = category
        }

        let internation_price = 1;
        if (currencyType === "USD") {
            let settingData = await Setting.getData();
            let internationPriceData = _.find(settingData, { 'meta_key': "international_price" });
            internation_price = internationPriceData.meta_value;
        }
        const [list, total_records] = await Promise.all([
            Product.list(obj, internation_price),
            Product.count(obj),
        ])
        return res.status(200).send({
            status: "success",
            message: "Product list",
            list: list,
            total_records: total_records,
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To get product details
Req: url_key
Res: 
---- */
exports.detail = async (req, res) => {
    // Collecting params
    let url_key = req.query.url_key || null;
    let customer_id = req.query.customer_id || null;
    let currencyType = req.query.currencyType || null;
    /* START: Validating params */
    if (!url_key) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let internation_price = 1;
        if (currencyType === "USD") {
            let settingData = await Setting.getData();
            let internationPriceData = _.find(settingData, { 'meta_key': "international_price" });
            internation_price = internationPriceData.meta_value;
        }
        let product = await Product.detail(url_key, internation_price)
        let product_images = await Product.prod_images(product.id)

        let prod_images = { basic_images: [], attribute_wise_images: [] }
        product_images.map(obj => {
            if (!obj.attribute_id && !obj.attribute_option_id) {
                prod_images.basic_images.push({
                    id: obj.id,
                    image: obj.image,
                    is_thumbnail: obj.is_thumbnail
                })
            } else {
                let idx = _.findIndex(prod_images.attribute_wise_images, { 'attribute_option_id': obj.attribute_option_id });
                if (idx === -1) {
                    prod_images.attribute_wise_images.push({
                        attribute_option_id: obj.attribute_option_id,
                        images: [{
                            id: obj.id,
                            image: obj.image,
                            is_thumbnail: obj.is_thumbnail,
                        }]
                    })
                } else {
                    prod_images.attribute_wise_images[idx].images.push({
                        id: obj.id,
                        image: obj.image,
                        is_thumbnail: obj.is_thumbnail,
                    })
                }

                // prod_images.attribute_wise_images.push({
                //     id: obj.id,
                //     image: obj.image,
                //     is_thumbnail: obj.is_thumbnail,
                //     attribute_id: obj.attribute_id,
                //     attribute_option_id: obj.attribute_option_id,
                // })
            }
        })

        let product_cats = await Product.prod_cats(product.id)
        let description_list = await Product.listDescription(product.id)

        let attr_data = await Product.attr_data(product.id)
        let attributes = []
        attr_data.map(row => {
            let idx = _.findIndex(attributes, { 'id': row.id });
            if (idx < 0) {
                attributes.push({
                    id: row.id,
                    name: row.name,
                    code: row.attr_code,
                    type: row.type,
                    options: [{
                        id: row.option_id,
                        option_value: row.option_value,
                        option_url_key: row.option_url_key,
                        color_code: row.color_code,
                    }]
                })
            } else {
                attributes[idx].options.push({
                    id: row.option_id,
                    option_value: row.option_value,
                    option_url_key: row.option_url_key,
                    color_code: row.color_code,
                })
            }
        })

        let variants = []
        let variants_list = await Product.variants(product.id)
        variants_list.map(row => {
            let idx = _.findIndex(variants, { 'variant_id': row.id });
            if (idx < 0) {
                variants.push({
                    variant_id: row.id,
                    name: row.name,
                    price: row.price,
                    is_sale_price: row.is_sale_price,
                    sale_price: row.sale_price,
                    stock: row.stock,
                    attr_data: [{
                        attribute_id: row.attribute_id,
                        attribute_option_id: row.attribute_option_id,
                    }]
                })
            } else {
                variants[idx].attr_data.push({
                    attribute_id: row.attribute_id,
                    attribute_option_id: row.attribute_option_id,
                })
            }
        })

        let relatedProds = await Product.relatedProds(product.id, internation_price)
        let isWishlisted = false
        if (customer_id) {
            isWishlisted = await Wishlist.isWishlisted({
                customer_id: customer_id,
                product_id: product.id,
            });
        }
        return res.status(200).send({
            status: "success",
            message: "Product detail",
            product: product,
            images: prod_images,
            categories: product_cats,
            description_list: description_list,
            attributes: attributes,
            variants: variants,
            relatedProds: relatedProds,
            is_wishlisted: isWishlisted
        });
    } catch (error) { 
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

/* ----
Purpose: To get list for admin panel
Req:  
Res: 
---- */
exports.admin_list = async (req, res) => {

    try {
        const response = await Product.admin_list();
        if (response) {
            return res.status(200).send({
                status: "success",
                message: "Product list",
                list: response,
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
Purpose: To get adminn view 
Req: id
Res: 
---- */
exports.admin_view = async (req, res) => {

    // Collecting params
    let product_id = req.query.product_id || null;

    /* START: Validating params */
    if (!product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        const product = await Product.admin_view(product_id); 
        const product_images = await Product.get_images(product_id, null, null, "all");
        const attr_data_for_sp_img = await Product.get_attr_data_for_sp_img(product_id);
        const categories = await Product.get_categories(product_id);
        let category_array = []
        categories.map(categoryObj => {
            category_array.push(categoryObj.category_id)
        })
        product.categories = category_array
        if (product) {
            return res.status(200).send({
                status: "success",
                message: "",
                product: product,
                images: product_images,
                attr_data_for_sp_img: attr_data_for_sp_img,
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
Purpose: To create product
Req: 
Res: 
---- */
exports.create = async (req, res) => {

    // Collecting params
    let type = req.body.type || "";
    let status = req.body.status || "";
    let name = req.body.name || "";
    let url_key = req.body.url_key || "";
    let price = req.body.price || 0;
    let is_sale_price = req.body.is_sale_price || "no";
    let sale_price = req.body.sale_price || 0;
    let gst = req.body.gst || 0;


    /* START: Validating params */
    if (!type || !status || !name || !url_key || !gst) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let obj = {
            type: type,
            status: status,
            name: name,
            url_key: url_key,
            price: price,
            is_sale_price: is_sale_price,
            sale_price: sale_price,
            gst:gst
        }


        let product = await Product.create(obj)

        return res.status(200).send({
            status: "success",
            message: "Product created successfully.",
            product: product
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};


/* ----
Purpose: To update product
Req: 
Res: 
---- */
exports.update = async (req, res) => {

    // Collecting params
    let product_id = req.body.product_id || "";
    let type = req.body.type || "";
    let status = req.body.status || "";
    let name = req.body.name || "";
    let url_key = req.body.url_key || "";
    let price = req.body.price || 0;
    let is_sale_price = req.body.is_sale_price || "no";
    let sale_price = is_sale_price === "yes" ? req.body.sale_price : null;
    let categories = req.body.categories || [];
    let is_exclusive = req.body.is_exclusive || "no";
    let sku = req.body.sku || "";
    let short_description = req.body.short_description || "";
    let tags = req.body.tags || "";
    let stock = req.body.stock || 0;
    let gst = req.body.gst || 0;


    /* START: Validating params */
    if (!product_id || !type || !status || !name || !url_key || !gst) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let obj = {
            product_id: product_id,
            type: type,
            status: status,
            name: name,
            url_key: url_key,
            price: price,
            is_sale_price: is_sale_price,
            sale_price: sale_price,
            is_exclusive: is_exclusive,
            sku: sku,
            short_description: short_description,
            tags: tags,
            stock: stock,
            gst:gst
        }

        await Product.update(obj)
        await Product.update_categories(product_id, categories)

        return res.status(200).send({
            status: "success",
            message: "Product updated successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};


/* ----
Purpose: To saveAttributeForVariants
Req: 
Res: 
---- */
exports.saveAttributeForVariants = async (req, res) => {

    // Collecting params
    let product_id = req.body.product_id || null;
    let attributes = req.body.attributes || null;

    /* START: Validating params */
    if (!product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {

        await Product.saveAttributeForVariants(product_id, attributes)

        return res.status(200).send({
            status: "success",
            message: "Attribute for variant are saved.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};


/* ----
Purpose: To create_variant of product
Req: 
Res: 
---- */
exports.create_variant = async (req, res) => {

    // Collecting params
    let attributes = req.body.attributes || [];
    let name = req.body.name || "";
    let price = req.body.price || 0;
    let is_sale_price = req.body.is_sale_price || "no";
    let sale_price = req.body.sale_price || null;
    let stock = req.body.stock || 0;
    let product_id = req.body.product_id || "";

    if (is_sale_price === "no") sale_price = null



    /* START: Validating params */
    if (attributes.lenght < 1 || !product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {

        // check if the variant is already exit, return error
        let pVariant = await Product.getProductVariantByAttributes(product_id, attributes)
        if (pVariant) {
            return res.status(403).send({
                status: "error",
                message: "Product variant with same atribute options is already exists.",
            });
        }

        let product_variant = await Product.create_variant(product_id, name, price, is_sale_price, sale_price, stock)
        await Product.save_variant_attribute(product_id, product_variant, attributes)

        return res.status(200).send({
            status: "success",
            message: "Product variant created successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};


/* ----
Purpose: To get product variant list 
Req: product_id
Res: array
---- */
exports.variant_list = async (req, res) => {
    // Collecting params
    let product_id = req.query.product_id || "";

    /* START: Validating params */
    if (!product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        const response = await Product.variant_list(product_id);
        let list = []
        response.map(row => {
            if (_.findIndex(list, { 'id': row.id }) < 0) {
                list.push({
                    id: row.id,
                    product_id: row.product_id,
                    name: row.name,
                    price: row.price,
                    is_sale_price: row.is_sale_price,
                    sale_price: row.sale_price,
                    stock: row.stock,
                    attributes: [{
                        id: row.attribute_id,
                        option_id: row.attribute_option_id,
                        name: row.attribute_name,
                        type: row.attribute_type,
                        option_value: row.attribute_option_value,
                    }]
                })
            } else {
                list[_.findIndex(list, { 'id': row.id })].attributes.push({
                    id: row.attribute_id,
                    option_id: row.attribute_option_id,
                    name: row.attribute_name,
                    type: row.attribute_type,
                    option_value: row.attribute_option_value,
                })
            }
        })

        if (response) {
            return res.status(200).send({
                status: "success",
                message: "Product variant list",
                list: list,
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
Purpose: To save display_separate_product_by_attribute field of product
Req: 
Res: 
---- */
exports.save_sp_prod_data = async (req, res) => {

    // Collecting params
    let product_id = req.body.product_id || "";
    let display_separate = req.body.display_separate || false;
    let attribute_id = req.body.attribute_id || null;

    if (!display_separate) {
        attribute_id = null
    }



    /* START: Validating params */
    if (!product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {

        await Product.save_sp_prod_data(product_id, attribute_id)

        return res.status(200).send({
            status: "success",
            message: "Product configuration saved successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};


/* ----
Purpose: To save attribute_for_separate_images field of product
Req: 
Res: 
---- */
exports.save_sp_img_data = async (req, res) => {

    // Collecting params
    let product_id = req.body.product_id || "";
    let display_separate = req.body.display_separate || false;
    let attribute_id = req.body.attribute_id || null;

    if (!display_separate) {
        attribute_id = null
    }



    /* START: Validating params */
    if (!product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {

        await Product.save_sp_img_data(product_id, attribute_id)

        return res.status(200).send({
            status: "success",
            message: "Product configuration saved successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To save product image
Req: 
Res: 
---- */
exports.save_prod_img = async (req, res) => {

    // Collecting params
    let product_id = req.body.product_id || "";
    let image = req.body.image || "";
    let attribute_id = req.body.attribute_id || null;
    let attribute_option_id = req.body.attribute_option_id || null;


    /* START: Validating params */
    if (!product_id && !image) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {

        let count = await Product.get_prod_img_count(product_id, attribute_id, attribute_option_id)

        let is_thumbnail = count > 0 ? 0 : 1
        await Product.save_prod_img(product_id, image, is_thumbnail, attribute_id, attribute_option_id)

        return res.status(200).send({
            status: "success",
            message: "Product image saved successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To del_prod_img
Req: 
Res: 
---- */
exports.del_prod_img = async (req, res) => {

    // Collecting params
    let product_id = req.body.product_id || "";
    let img_id = req.body.img_id || "";
    let image = req.body.image || "";
    let attribute_id = req.body.attribute_id || null;
    let attribute_option_id = req.body.attribute_option_id || null;


    /* START: Validating params */
    if (!product_id && !img_id && !image) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {

        // delete 
        await s3Controller.deleteFile(image);
        await Product.del_prod_img(img_id)

        // get image
        const product_images = await Product.get_images(product_id, attribute_id, attribute_option_id, "single");


        if (product_images.length > 0) {
            // check is_thumb exists
            let thumb_img_exists = false
            product_images.map(img => {
                if (img.is_thumbnail === 1) thumb_img_exists = true
            })

            if (!thumb_img_exists) {
                await Product.mark_img_thumb(product_images[0].id, product_id)
            }
        }

        return res.status(200).send({
            status: "success",
            message: "Product image deleted successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To del_prod_img
Req: 
Res: 
---- */
exports.mark_img_thumb = async (req, res) => {

    // Collecting params
    let img_id = req.body.img_id || "";
    let product_id = req.body.product_id || "";
    let attribute_id = req.body.attribute_id || null;
    let attribute_option_id = req.body.attribute_option_id || null;


    /* START: Validating params */
    if (!img_id && !product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {

        await Product.mark_img_thumb(img_id, product_id, attribute_id, attribute_option_id)

        return res.status(200).send({
            status: "success",
            message: "Product image marked as thumbnail.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To del_prod_var
Req: 
Res: 
---- */
exports.del_prod_var = async (req, res) => {

    // Collecting params
    let product_id = req.body.product_id || "";
    let product_variant_id = req.body.product_variant_id || "";


    /* START: Validating params */
    if (!product_id && !product_variant_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {

        await Product.del_prod_var(product_id, product_variant_id)

        return res.status(200).send({
            status: "success",
            message: "Product variant deleted successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To create product description
Req: 
Res: 
---- */
exports.addDescription = async (req, res) => {


    // Collecting params
    let product_id = req.body.product_id || "";
    let title = req.body.title || "";


    /* START: Validating params */
    if (!product_id || !title) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        await Product.addDescription(product_id, title)

        return res.status(200).send({
            status: "success",
            message: "Product description created successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To get list of  product description
Req: 
Res: 
---- */
exports.listDescription = async (req, res) => {


    // Collecting params
    let product_id = req.query.product_id || "";


    /* START: Validating params */
    if (!product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let list = await Product.listDescription(product_id)

        return res.status(200).send({
            status: "success",
            message: "Product description list.",
            list: list
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To get description 
Req: 
Res: 
---- */
exports.descriptionView = async (req, res) => {


    // Collecting params
    let description_id = req.query.description_id || "";

    /* START: Validating params */
    if (!description_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let description = await Product.descriptionView(description_id)

        return res.status(200).send({
            status: "success",
            message: "Product description list.",
            description: description
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To update product description
Req: 
Res: 
---- */
exports.updateDescription = async (req, res) => {


    // Collecting params
    let description_id = req.body.description_id || "";
    let title = req.body.title || "";
    let content = req.body.content || "";
    let sequence = req.body.sequence || 1;


    /* START: Validating params */
    if (!description_id || !title) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        await Product.updateDescription(description_id, title, content, sequence)

        return res.status(200).send({
            status: "success",
            message: "Product description updated successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};



/* ----
Purpose: To add related product 
Req: 
Res: 
---- */
exports.addRelProd = async (req, res) => {


    // Collecting params
    let product_id = req.body.product_id || "";
    let related_product_id = req.body.related_product_id || "";


    /* START: Validating params */
    if (!product_id || !related_product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        await Product.delRelProd(product_id, related_product_id)
        await Product.addRelProd(product_id, related_product_id)

        return res.status(200).send({
            status: "success",
            message: "Related product added successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To del related product 
Req: 
Res: 
---- */
exports.delRelProd = async (req, res) => {


    // Collecting params
    let product_id = req.body.product_id || "";
    let related_product_id = req.body.related_product_id || "";


    /* START: Validating params */
    if (!product_id || !related_product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        await Product.delRelProd(product_id, related_product_id)

        return res.status(200).send({
            status: "success",
            message: "Related product deleted successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To get list related product 
Req: 
Res: 
---- */
exports.listRelProd = async (req, res) => {

    // Collecting params
    let product_id = req.query.product_id || "";


    /* START: Validating params */
    if (!product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let list = await Product.listRelProd(product_id)

        return res.status(200).send({
            status: "success",
            message: "Related products.",
            list: list
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

exports.exclusiveProd = async (req, res) => {
    let currencyType = req.body.currencyType || "";
    let internation_price = 1;
    if (currencyType === "USD") {
        let settingData = await Setting.getData();
        let internationPriceData = _.find(settingData, { 'meta_key': "international_price" });
        internation_price = internationPriceData.meta_value;
    }

    try {   
        let response =  await Product.getExclusives(internation_price)
        let exclvsPrds = response['products']              

        return res.status(200).send({
            status: "success",
            message: "Related products.",
            list: exclvsPrds
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

