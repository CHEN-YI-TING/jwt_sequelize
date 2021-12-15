const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

module.exports.signup = (req, res) => {
  //save user to db
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.hashSync(req.body.password, 8),
  })
    .then((user) => {
      if (req.body.roles) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles,
            },
          },
        }).then((roles) => {
          user.setRoles(roles).then(() => {
            res.send({ message: "註冊成功" });
          });
        });
      } else {
        //user role = 1
        user.setRoles([1]).then(() => {
          res.send({ message: "註冊成功" });
        });
      }
    })
    .catch((err) => {
      //500 server error
      res.status(500).send({ message: err.message });
    });
};

module.exports.signin = (req, res) => {
  User.findOne({ where: { username: req.body.username } })
    .then((user) => {
      if (!user) {
        return res.status(404).send({ message: "用戶不存在" });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "無效的密碼",
        });
      }
      //密碼驗證成功後，將token回傳給使用者
      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400,
      });

      //被授權的角色
      var authorities = [];
      user.getRoles().then((roles) => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }
        //以上搜尋資料庫相應的角色並放入array
        res.status(200).send({
          id: user.id,
          username: user.username,
          email: user.email,
          roles: authorities,
          accessToken: token,
        });
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};
