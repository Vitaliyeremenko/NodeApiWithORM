module.exports = function (sequilize, DataTypes) {
  const Item = sequilize.define('Item',{
    title: DataTypes.STRING,
    user_id: DataTypes.DECIMAL,
    description: DataTypes.STRING,
    image: DataTypes.STRING,
  });

  return Item;
};

