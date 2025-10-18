import ChatClient from "./chat-client-voice"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params

  return <ChatClient countryCode={countryCode} />
}
