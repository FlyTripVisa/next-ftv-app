import dynamic from "next/dynamic";

// Hugging Face Chat UI is client-side only
const Chat = dynamic(() => import("@huggingface/chat-ui"), { ssr: false });

export default function ChatPage() {
  return (
    <div style={{ height: "100vh" }}>
      <Chat
        title="FlyTripVisa Assistant"
        model="gpt2" // or any Hugging Face model you want
        apiUrl="https://api-inference.huggingface.co/models/gpt2"
        token={process.env.NEXT_PUBLIC_HF_TOKEN}
      />
    </div>
  );
}
