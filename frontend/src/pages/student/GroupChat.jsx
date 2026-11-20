
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Image, X } from "lucide-react";
import {
  getGroupMessages,
  sendGroupMessage,
  sendGroupImage,
} from "../../services/groupService";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from "../../services/socketService";
import { markGroupNotificationsAsRead } from "../../services/notificationService";



function GroupChat() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const imageInputRef = useRef(null);

  const messagesEndRef = useRef(null);

  const currentUser = JSON.parse(
    localStorage.getItem("authUser") || "{}"
  );

  const fetchMessages = async () => {
    try {
      const response = await getGroupMessages(groupId);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
  const token = localStorage.getItem("authToken");

  if (!token) return;

  const socket = connectSocket(token);

  const handleConnect = () => {
    console.log("Socket connected:", socket.id);

    socket.emit("join-group", { groupId }, (response) => {
      if (response.success) {
        console.log("Joined group successfully");
      } else {
        console.error("Group join failed:", response.message);
      }
    });
  };

  const handleConnectError = (error) => {
    console.error("Socket connection error:", error.message);
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

  useEffect(() => {
    const socket = getSocket();

    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      // Prevent duplicate messages
      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (message) => message._id === newMessage._id
        );

        if (alreadyExists) return prevMessages;

        return [...prevMessages, newMessage];
      });
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, []);

  useEffect(() => {
  if (!groupId) return;

  const markGroupAsRead = async () => {
    try {
      await markGroupNotificationsAsRead(groupId);
    } catch (error) {
      console.error(
        "Failed to mark group notifications as read:",
        error
      );
    }
  };

  markGroupAsRead();
  }, [groupId]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];

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

    // Allow selecting the same image again
    e.target.value = "";
  };

  const handleSendImage = async () => {
  if (!selectedImage || uploadingImage) return;

  try {
    setUploadingImage(true);

    const response = await sendGroupImage(
      groupId,
      selectedImage
    );

    setMessages((prevMessages) => {
      const alreadyExists = prevMessages.some(
        (message) => message._id === response.data._id
      );

      if (alreadyExists) return prevMessages;

      return [...prevMessages, response.data];
    });

    URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview("");
  } catch (error) {
    console.error("Image upload failed:", error);

    alert(
      error.response?.data?.message || "Image upload failed"
    );
  } finally {
    setUploadingImage(false);
  }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!content.trim() || sending) return;

    try {
      setSending(true);

      const response = await sendGroupMessage(
        groupId,
        content.trim()
      );

      setMessages((prevMessages) => {
        const alreadyExists = prevMessages.some(
          (message) => message._id === response.data._id
        );

        if (alreadyExists) return prevMessages;

        return [...prevMessages, response.data];
      });

      setContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
      alert(
        error.response?.data?.message || "Message sending failed"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#efeae2]">
      {/* Header */}
      <header className="flex items-center gap-3 bg-indigo-700 px-4 py-4 text-white shadow">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft size={22} />
        </button>

        <div>
          <h1 className="font-semibold">Course Group</h1>
          <p className="text-xs text-indigo-200">
            Group Discussion
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
                    isOwnMessage
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2 shadow-sm ${
                      isOwnMessage
                        ? "bg-[#d9fdd3]"
                        : "bg-white"
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
                      {new Date(
                        message.createdAt
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
              onClick={() => {
                URL.revokeObjectURL(imagePreview);
                setSelectedImage(null);
                setImagePreview("");
              }}
              className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
            >
              <X size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSendImage}
            disabled={uploadingImage}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {uploadingImage ? "Uploading..." : "Send Image"}
          </button>
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
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          maxLength={5000}
          className="flex-1 rounded-full bg-gray-100 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="rounded-full bg-indigo-600 p-3 text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default GroupChat;
