module.exports = {
  async up(queryInterface) {
    const tableMessages = await queryInterface.describeTable("ChatMessages");
    const tableRooms = await queryInterface.describeTable("ChatRooms");

    if (tableMessages.room) {
      await queryInterface.addIndex("ChatMessages", ["room"], {
        name: "idx_chatmessages_room",
      });
    }

    if (tableMessages.timestamp) {
      await queryInterface.addIndex("ChatMessages", ["timestamp"], {
        name: "idx_chatmessages_timestamp",
      });
    }

    if (tableMessages.senderId && tableMessages.receiverId) {
      await queryInterface.addIndex("ChatMessages", ["senderId", "receiverId"], {
        name: "idx_chatmessages_sender_receiver",
      });
    }

    if (tableRooms.user1Id && tableRooms.user2Id) {
      await queryInterface.addIndex("ChatRooms", ["user1Id", "user2Id"], {
        name: "idx_chatrooms_user1_user2",
      });
    }

    if (tableRooms.trangThai) {
      await queryInterface.addIndex("ChatRooms", ["trangThai"], {
        name: "idx_chatrooms_trangthai",
      });
    }

    if (tableRooms.thoiGianBatDauChat) {
      await queryInterface.addIndex("ChatRooms", ["thoiGianBatDauChat"], {
        name: "idx_chatrooms_thoigianbatdauchat",
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("ChatMessages", "idx_chatmessages_room");
    await queryInterface.removeIndex("ChatMessages", "idx_chatmessages_timestamp");
    await queryInterface.removeIndex("ChatMessages", "idx_chatmessages_sender_receiver");

    await queryInterface.removeIndex("ChatRooms", "idx_chatrooms_user1_user2");
    await queryInterface.removeIndex("ChatRooms", "idx_chatrooms_trangthai");
    await queryInterface.removeIndex("ChatRooms", "idx_chatrooms_thoigianbatdauchat");
  },
};
