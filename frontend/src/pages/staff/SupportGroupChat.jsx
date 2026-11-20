
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Image, X, Users } from "lucide-react";

import {
  getGroupMessages,
  getMySupportGroups,
  sendGroupMessage,
  sendGroupImage,
} from "../../services/groupService";

import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "../../services/socketService";

import { markGroupNotificationsAsRead } from "../../services/notificationService";

function SupportGroupChat() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);

  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const currentUser = JSON.parse(
    localStorage.getItem("authUser") || "{}"
  );

  // Fetch group details and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [messagesResponse, groupsResponse] =
          await Promise.all([
            getGroupMessages(groupId),
            getMySupportGroups(),
          ]);

        setMessages(messagesResponse.data.messages || []);

        const currentGroup = (groupsResponse.data || []).find(
          (group) => String(group.groupId) === String(groupId)
        );

        setGroupDetails(currentGroup || null);
      } catch (error) {
        console.error("Failed to load group:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // Socket connection and group joining
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const socket = connectSocket(token);

    const handleConnect = () => {
      socket.emit("join-group", { groupId }, (response) => {
        if (!response?.success) {
          console.error("Group join failed:", response?.message);
        }
      });
    };

    const handleConnectError = (error) => {
      console.error("Socket error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      disconnectSocket();
    };
  }, [groupId]);

  // Listen for new messages
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (String(newMessage.group) !== String(groupId)) return;

      setMessages((previous) => {
        const exists = previous.some(
          (message) => message._id === newMessage._id
        );

        return exists ? previous : [...previous, newMessage];
      });
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [groupId]);

  // Mark group notifications as read
  useEffect(() => {
    if (!groupId) return;

    markGroupNotificationsAsRead(groupId).catch((error) => {
      console.error("Failed to mark notifications as read:", error);
    });
  }, [groupId]);

  // Select image
  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5 MB");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    event.target.value = "";
  };

  // Remove selected image
  const removeSelectedImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);

    setSelectedImage(null);
    setImagePreview("");
  };

  // Send text or image
  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (selectedImage) {
      if (uploadingImage) return;

      try {
        setUploadingImage(true);

        const response = await sendGroupImage(groupId, selectedImage);

        setMessages((previous) => {
          const exists = previous.some(
            (message) => message._id === response.data._id
          );

          return exists ? previous : [...previous, response.data];
        });

        removeSelectedImage();
      } catch (error) {
        console.error("Image upload failed:", error);
        alert(error.response?.data?.message || "Image upload failed");
      } finally {
        setUploadingImage(false);
      }

      return;
    }

    if (!content.trim() || sending) return;

    try {
      setSending(true);

      const response = await sendGroupMessage(
        groupId,
        content.trim()
      );

      setMessages((previous) => {
        const exists = previous.some(
          (message) => message._id === response.data._id
        );

        return exists ? previous : [...previous, response.data];
      });

      setContent("");
    } catch (error) {
      console.error("Message sending failed:", error);
      alert(error.response?.data?.message || "Message sending failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#efeae2]">
      {/* Header */}
      <header className="flex items-center gap-3 bg-indigo-700 px-4 py-4 text-white shadow">
        <button
          type="button"
          onClick={() => navigate("/support/groups")}
          className="rounded-full p-1 hover:bg-indigo-600"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500">
          <Users size={20} />
        </div>

        <div className="min-w-0">
          <h1 className="truncate font-semibold">
            {groupDetails?.groupName || "Course Group"}
          </h1>
          <p className="truncate text-xs text-indigo-200">
            {groupDetails?.course?.title || "Group Discussion"}
            {groupDetails?.memberCount != null &&
              ` • ${groupDetails.memberCount} members`}
          </p>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {loading ? (
            <p className="text-center text-gray-500">
              Loading messages...
            </p>
          ) : messages.length === 0 ? (
            <p className="mt-10 text-center text-gray-500">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((message) => {
              const senderId =
                message.sender?._id || message.sender;

              const isOwnMessage =
                String(senderId) === String(currentUser.id);

              return (
                <div
                  key={message._id}
                  className={`flex ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2 shadow-sm ${
                      isOwnMessage ? "bg-[#d9fdd3]" : "bg-white"
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="mb-1 text-xs font-semibold text-indigo-600">
                        {message.sender?.name || "User"}
                      </p>
                    )}

                    {message.messageType === "image" ? (
                      <img
                        src={message.image?.url}
                        alt="Shared image"
                        className="max-h-72 w-full rounded-lg object-contain"
                      />
                    ) : (
                      <p className="break-words text-sm text-gray-800">
                        {message.content}
                      </p>
                    )}

                    <p className="mt-1 text-right text-[10px] text-gray-500">
                      {new Date(message.createdAt).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Image Preview */}
      {imagePreview && (
        <div className="border-t bg-white px-4 py-3">
          <div className="relative w-fit">
            <img
              src={imagePreview}
              alt="Selected preview"
              className="h-24 w-24 rounded-lg border object-cover"
            />

            <button
              type="button"
              onClick={removeSelectedImage}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-3 border-t bg-white px-4 py-3"
      >
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          onChange={handleImageSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="rounded-full p-3 text-gray-600 hover:bg-gray-100"
        >
          <Image size={20} />
        </button>

        <input
          type="text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message..."
          maxLength={5000}
          className="flex-1 rounded-full bg-gray-100 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          type="submit"
          disabled={
            (!content.trim() && !selectedImage) ||
            sending ||
            uploadingImage
          }
          className="rounded-full bg-indigo-600 p-3 text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default SupportGroupChat;
