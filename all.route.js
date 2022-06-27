var jwtVerify = require("./controllers/jwt.verify.js")
const productController = require("./controllers/product.controller")
const categoryController = require("./controllers/category.controller")
const userController = require("./controllers/user.controller")
const attributeController = require("./controllers/attribute.controller")
const s3Controller = require("./controllers/s3.controller")
const homePageSliderController = require("./controllers/homePageSlider.controller")
const testimonialController = require("./controllers/testimonial.controller")
const salesOrderController = require("./controllers/salesOrder.controller")
const customerController = require("./controllers/customer.controller")
const countryController = require("./controllers/country.controller")
const razorpayController = require("./controllers/razorpay.controller")
const wishlistController = require("./controllers/wishlist.controller")
const settingController = require("./controllers/setting.controller")
const couponController = require("./controllers/coupon.controller")
const contactEnquiryController = require("./controllers/contactEnquiry.controller")


module.exports = app => {
    /* product */
    app.get("/product/list", productController.list)
    app.get("/product/detail", productController.detail)
    app.post("/product/create", productController.create)
    app.get("/product/admin-list", productController.admin_list)
    app.get("/product/admin-view", productController.admin_view)
    app.post("/product/update", productController.update)
    app.post("/product/save-attribute-for-variants", productController.saveAttributeForVariants)
    app.post("/product/create-variant", productController.create_variant)
    app.get("/product/variant-list", productController.variant_list)
    app.post("/product/save-sp-prod-data", productController.save_sp_prod_data)
    app.post("/product/save-sp-img-data", productController.save_sp_img_data)
    app.post("/product/save-prod-img", productController.save_prod_img)
    app.post("/product/del-prod-img", productController.del_prod_img)
    app.post("/product/mark-img-thumb", productController.mark_img_thumb)
    app.post("/product/del-prod-var", productController.del_prod_var)
    app.post("/product/add-description", productController.addDescription)
    app.get("/product/list-description", productController.listDescription)
    app.get("/product/description-view", productController.descriptionView)
    app.post("/product/update-description", productController.updateDescription)
    app.post("/product/add-rel-prod", productController.addRelProd)
    app.post("/product/del-rel-prod", productController.delRelProd)
    app.get("/product/list-rel-prod", productController.listRelProd)
    app.get('/product/exclusive', productController.exclusiveProd)
    /* attributes */
    app.get("/attribute/list", attributeController.list)

    /* category */
    app.get("/category/details", categoryController.details)
    app.get("/category/tree", categoryController.tree)
    app.post("/category/create", categoryController.create)
    app.get("/category/view", categoryController.view)
    app.post("/category/update", categoryController.update)
    app.post("/category/delete", categoryController.delete)

    /* user */
    app.post("/user/login", userController.login)


    /* home */
    app.post("/home/save-slider-imgs", homePageSliderController.save)
    app.get("/home/slider-list", homePageSliderController.list)
    app.post("/home/del-slider", homePageSliderController.delete)
    app.post("/home/data", homePageSliderController.homePageData)

    /* testimonial/save */
    app.post("/testimonial/save", testimonialController.save)
    app.get("/testimonial/list", testimonialController.list)
    app.post("/testimonial/delete", testimonialController.delete)


    /* sales_order */
    app.post("/cart/update", salesOrderController.update)
    app.get("/cart/count", salesOrderController.count)
    app.get("/cart/website_view", salesOrderController.websiteView)
    app.post("/cart/update-address", salesOrderController.updateAddress)
    app.post("/cart/place-cod-order", salesOrderController.placeCodOrder)
    app.get("/order/list", jwtVerify.verifyToken, salesOrderController.list)
    app.get("/order/detail", jwtVerify.verifyToken, salesOrderController.detail)
    app.get("/order/admin_list", salesOrderController.admin_list)
    app.get("/order/admin-order-details", salesOrderController.admin_detail)
    app.post("/order/admin-order-update", salesOrderController.order_update)
    app.get("/cart/generateInvoice", salesOrderController.generateInvoice)

    /* customer */
    app.post("/customer/create", customerController.create)    
    app.post("/customer/add-address", jwtVerify.verifyToken, customerController.create_address)
    app.get("/customer/get-address", jwtVerify.verifyToken, customerController.get_address)
    app.post("/customer/delete-address", jwtVerify.verifyToken, customerController.delete_address)
    app.post("/customer/login", customerController.login)
    app.get("/customer/detail", jwtVerify.verifyToken, customerController.detail)
    app.get("/customer/admin_list", customerController.admin_list)
    app.post("/customer/sendOtp", customerController.sendOtp)
    app.post("/customer/resetPassword", customerController.resetPassword)


    /* country */
    app.get("/country/list", countryController.list)
    app.get("/state/list", countryController.stateList)

    /* razorpay */
    app.post("/rzorder/create", razorpayController.create)
    app.post("/rzorder/verify-payment", razorpayController.verify_payment)

    /* S3 */
    app.get("/get-singed-url-for-put", jwtVerify.verifyToken, s3Controller.getSingedUrlforPut)

    /* WishList */
    app.post("/wishlist/create", jwtVerify.verifyToken, wishlistController.create)
    app.get("/wishlist/list", jwtVerify.verifyToken, wishlistController.wishList)
    app.post("/wishlist/remove", jwtVerify.verifyToken, wishlistController.removeWishlist)

    // Setting
    app.post("/setting/update", settingController.update)
    app.get("/setting/list", settingController.list)
    app.post("/setting/updateShipping", settingController.updateShipping)
    app.get("/setting/offer", settingController.getOffer)
    //coupon
    app.get("/coupon/list", couponController.list)
    app.post("/coupon/create", couponController.add)
    app.get("/coupon/view", couponController.view)
    app.post("/coupon/update", couponController.update)
    app.post("/coupon/applyCoupon", couponController.applyCoupon)
    app.post("/coupon/removeCode", couponController.removeAppliedCoupon)
    //contact
    app.post("/contact/create", contactEnquiryController.create)



}