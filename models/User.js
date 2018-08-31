module.exports = function (sequilize, DataTypes) {
  const User = sequilize.define('User',{
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    session_token: DataTypes.STRING
  });

  return User;
};

