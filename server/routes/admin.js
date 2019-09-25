/**
 * Created by Administrator on 2017/10/24.
 */
var express = require("express");
var path = require("path");
var md5 = require("md5");

var router = express.Router();
var User = require("../models/user");
var Category = require("../models/category");
var Content = require("../models/content");
var formidable = require("formidable"); // 用来处理上传图片的

// 检测是否登陆
router.get('/isadmin', (req, res, next) => {
    if (JSON.stringify(req.cookies) == "{}") {
        res.json({ code: 0, msg: "请先登录啦" })
    } else {
        res.json({ code: 1, islogin: 'logined', msg: "登陆成功" })
    }
})

// 登陆接口
router.post('/login', (req, res, next) => {
    var username = req.body.username || req.query.username || "";
    var password = req.body.password || req.query.password || "";

    console.log('username', username);
    console.log('password', password);

    User.findOne({
        username: username,
        password: md5(password)
    }, function (err, userinfo) {
        if (err) {
            console.log(err);
        }
        if (!userinfo) {
            res.json({ code: 0, msg: "用户名或密码错误！" });
            return false;
        }

        res.cookie("userInfo", JSON.stringify({
            "_id": userinfo._id,
            "username": userinfo.username,
            "isadmin": userinfo.isadmin
        }), { maxAge: 1000 * 60, httpOnly: true })

        res.json({
            code: 1,
            msg: "登录成功！",
            userinfo: {
                id: userinfo._id,
                username: userinfo.username
            }
        });

    })

});

// 退出登陆接口
router.get('/logout', (req, res, next) => {
    res.cookie('userInfo', null, { expires: new Date(0) });
    res.json({ code: 1, msg: "退出成功" })
})

// 获取用户列表接口
router.get("/getuser", function (req, res, next) {

    var page = Number(req.query.page || 1);
    var limit = 8;
    var skip = (page - 1) * limit;
    var total;
    var counts;
    User.count().then(function (count) {
        total = Math.ceil(count / limit);
        page = Math.max(1, page);
        page = Math.min(page, total);
        counts = count;
    });
    User.find().limit(limit).skip(skip).then(function (users) {

        res.json({
            userInfo: req.userInfo,
            users: users,
            page: page,
            total: total,
            counts: counts
        })
    });

});

// 获取文章分类接口
router.get("/categories", (req, res, next) => {
    Category.find().sort({ _id: -1 }).then(function (categories) {
        res.json({
            userInfo: req.userInfo,
            categories: categories
        });
    });
});

// 新增文章分类
router.post("/categories/add", (req, res, next) => {
    var name = req.body.name || "";
    //console.log(name);
    // if (name == "") {
    //     res.render("admin/error", { userInfo: req.userInfo });
    // }
    // else {
    Category.findOne({ name: name }, function (err, info) {
        if (err) {
            console.log(err);
        }
        if (info) {
            res.json({ code: 0, msg: "出错了！请联系我！" });
            return false;
        }
        var newcate = new Category({
            name: name
        });
        newcate.save();
        res.json({ code: 1, msg: "新增成功！" });

    });
    // }
})

// 删除文章分类
router.post('/categories/del', (req, res, next) => {
    var id = req.body.id || "";
    Category.deleteOne({ _id: id }, function (err) {
        if (err) {
            res.json({ code: 0, msg: "出错了 !" })
            return false;
        } else {
            res.json({ code: 1, msg: "删除成功 !" });
        }
    });
});

// 修改文章分类名称
router.post('/categories/edit', (req, res, next) => {
    var name = req.body.name || "";
    var id = req.body.id || "";
    // console.log(req.query);
    // console.log(req.body);
    Category.findOne({ _id: id }, function (err, info) {
        if (err) {
            res.json({ code: 0, msg: "更新失败，打电话给我吧！" })
            console.log(err);
        }
        if (info) {
            // console.log(info);
            info.name = name;
            info.save();
            res.json({ code: 1, msg: "更新成功，哥要睡觉了！" })
        }

    });
});

// 获取文章接口
router.get("/articles", (req, res, next) => {
    Content.find().populate(["category", "user"]).sort({ _id: -1 }).then(function (contents) {
        // console.log(contents);
        res.json({
            userInfo: req.userInfo,
            contents: contents
        });
    });
})

// 添加文章接口
router.post('/articles/add', (req, res, next) => {
    var title = req.body.title || "";
    var category = req.body.category || "";
    var description = req.body.description || "";
    var description_sub = req.body.description_sub || "";
    var content = req.body.content || "";
    var newcontent = new Content({
        title: title,
        category: category,
        description: description,
        description_sub: description_sub,
        composition: content,
        addtime: new Date(),
        num: 0,
        // user: req.userInfo._id.toString()
        user: "5d37d4b925c2e64b90f2d912" // 暂时写死这个 后期再加cookie
    });
    newcontent.save();
    res.json({ code: 1, msg: "添加文章成功 !" })
})

// 删除文章接口
router.post('/articles/del', (req, res, next) => {
    var id = req.body.id || req.query.id || "";
    Content.deleteOne({ _id: id }, function (err) {
        if (err) {
            res.json({ code: 0, msg: "出错了 !" })
            return false;
        } else {
            res.json({ code: 1, msg: "删除成功 !" });
        }
    });
});

// 编辑文章接口
router.post("/content/edit", function (req, res) {
    var id = req.query.id || req.body.id || "";
    var title = req.body.title || "";
    var category = req.body.category || "";
    var description = req.body.description || "";
    var description_sub = req.body.description_sub || "";
    var minpic_url = req.body.minpic_url || "";
    var content = req.body.content || "";
    console.log(content);
    Content.update({ _id: id }, {
        title: title,
        category: category,
        description: description,
        description_sub: description_sub,
        minpic_url: minpic_url,
        composition: content,
        addtime: new Date(),
        num: 0,
        // user: req.userInfo._id.toString()
        user: "5d37d4b925c2e64b90f2d912" // 暂时写死这个 后期再加cookie
    }).then(function () {
        res.json({
            // userInfo: req.userInfo,
            code: 1,
            message: "ok!修改成功"
        });
    }).catch(err => {
        console.log(err);
    })

});

// 图片上传接口
router.post("/content/img_upload", function (req, res) {
    var form = new formidable.IncomingForm()
    form.uploadDir = "./upload";
    form.keepExtentsions = true;
    form.parse(req, function (err, fields, files) {
        console.log(fields);
        console.log(files);
        // res.json({code:0})
        // return
        if (err) {
            console.log(err);
            res.json({ code: 0, msg: "上传失败！" })
        } else {
            var ip = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');
            res.json({
                code: 1,
                msg: "上传成功！",
                path: 'http://' + ip + '/' + path.basename(files.image.path)
            })
        }
    })
})

// 文章缩略图上传接口
router.post("/content/mpic_upload", function (req, res, next) {
    var form = new formidable.IncomingForm()
    form.uploadDir = "./upload";
    form.keepExtentsions = true;
    form.parse(req, function (err, fields, files) {
        console.log(files);
        if (err) {
            console.log(err);
            res.json({ code: 0, msg: "上传失败！" });
        } else {
            var ip = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');
            res.json({
                code: 1,
                msg: "上传成功！",
                path: 'http://' + ip + '/' + path.basename(files.file.path)
            })
        }

    })
})

module.exports = router;