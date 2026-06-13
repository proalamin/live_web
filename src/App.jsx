import { useState, useCallback, useMemo } from 'react'
import streamsData from './streams.json'
import Layout from './components/Layout'
import ChannelList from './components/ChannelList'
import VideoPlayer from './components/VideoPlayer'

export default function App() {
  const channels = useMemo(() => streamsData.channels ?? [], [])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const activeChannel = channels[selectedIndex] ?? null

  const handleAutoSwitch = useCallback(() => {
    setSelectedIndex(prev => (prev + 1) % channels.length)
  }, [channels.length])

  return (
    <Layout
      sidebar={
        <ChannelList
          channels={channels}
          activeIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      }
    >
      <VideoPlayer
        source={activeChannel}
        allSources={channels}
        activeSourceIndex={selectedIndex}
        onAutoSwitch={handleAutoSwitch}
        onManualSwitch={setSelectedIndex}
      />
    </Layout>
  )
}
