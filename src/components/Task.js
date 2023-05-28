import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const Task = ({ task }) => {
  const { item, itemsLeft, square, itemText, circular } = styles;

  return (
    <View style={item}>
      <View style={itemsLeft}>
        <View style={square}></View>
        <Text style={itemText}>{task}</Text>
      </View>
      <View style={circular}></View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  itemsLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  square: {
    width: 24,
    height: 24,
    backgroundColor: "#55b5f6",
    opacity: 0.4,
    borderRadius: 5,
    marginRight: 15,
  },
  circular: {
    width: 12,
    height: 12,
    borderColor: "#55bcf6",
    borderWidth: 2,
    borderRadius: 5,
  },
  itemText: {
    maxWidth: "80%",
  },
});

export default Task;
