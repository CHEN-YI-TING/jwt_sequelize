const jwt = require("jsonwebtoken");
const { send } = require("process");
//密鑰設定
const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;

//驗證token
verifyToken = (req, res, next) => {
  //獲取token
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "沒有提供token" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "未授權" });
    }
    req.userId = decoded.id;
  });
};

//找到此用戶角色
//管理員
isAdmin = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      //找用戶角色
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "admin") {
          next();
          return;
        }
      }
      //如果找不到的話
      res.status(403).send({ message: "沒有此用戶角色" });
      return;
    });
  });
};

//版主
isModerator = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "moderator") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Require Moderator Role!",
      });
    });
  });
};

//版主或管理員
isModeratorOrAdmin = (req, res, next) => {
  User.findByPk(req.userId).then((user) => {
    user.getRoles().then((roles) => {
      for (let i = 0; i < roles.length; i++) {
        if (roles[i].name === "moderator") {
          next();
          return;
        }

        if (roles[i].name === "admin") {
          next();
          return;
        }
      }

      res.status(403).send({
        message: "Require Moderator or Admin Role!",
      });
    });
  });
};

const authJwt = {
  verifyToken: verifyToken,
  isAdmin: isAdmin,
  isModerator: isModerator,
  isModeratorOrAdmin: isModeratorOrAdmin,
};
module.exports = authJwt;
