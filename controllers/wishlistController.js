const Wishlist=require("../models/Wishlist");

exports.getWishlist=async(req,res)=>{
    let wishlist=await Wishlist.findOne({
        user:req.user._id
    }).populate("products");

    if(!wishlist){
        wishlist=await Wishlist.create({
            user:req.user._id,
            products:[]
        });
    }

    res.json({
        success:true,
        wishlist
    });
};

exports.addWishlist=async(req,res)=>{
    const {productId}=req.body;

    let wishlist=await Wishlist.findOne({
        user:req.user._id
    });

    if(!wishlist){
        wishlist=await Wishlist.create({
            user:req.user._id,
            products:[]
        });
    }

    if(!wishlist.products.includes(productId)){
        wishlist.products.push(productId);
    }

    await wishlist.save();

    res.json({
        success:true,
        message:"Added to wishlist"
    });
};

exports.removeWishlist=async(req,res)=>{

    const wishlist=await Wishlist.findOne({
        user:req.user._id
    });

    wishlist.products=wishlist.products.filter(
        id=>id.toString()!=req.params.id
    );

    await wishlist.save();

    res.json({
        success:true
    });
};