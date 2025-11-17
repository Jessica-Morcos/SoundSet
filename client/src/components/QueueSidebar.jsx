// src/components/QueueSidebar.jsx
import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext";
import { motion } from "framer-motion";
import { X, Trash2, GripVertical } from "lucide-react";

import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";

import { CSS } from "@dnd-kit/utilities";

const NAVBAR_HEIGHT = 64;

/* -------------------------------------------------------
   SORTABLE ITEM
------------------------------------------------------- */
function SortableQueueItem({ song, playSong, removeFromQueue }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full flex items-center justify-between px-2 py-2 rounded-lg bg-purple-900/40 hover:bg-purple-900/60 text-xs"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-purple-300 hover:text-white mr-2"
      >
        <GripVertical size={16} />
      </button>

      <button
        onClick={() => playSong(song)}
        className="flex-1 flex items-center gap-2 text-left"
      >
        {song.coverUrl && (
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-9 h-9 rounded object-cover"
          />
        )}
        <div>
          <p className="font-semibold text-[0.8rem] leading-tight">
            {song.title}
          </p>
          <p className="text-[0.7rem] text-purple-200">{song.artist}</p>
        </div>
      </button>

      <button
        onClick={() => removeFromQueue(song._id)}
        className="ml-2 text-purple-300 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------
   SIDEBAR
------------------------------------------------------- */
export default function QueueSidebar() {
  const {
    isQueueOpen,
    setIsQueueOpen,
    currentSong,
    playlist,
    currentIndex,
    queue,
    playSong,
    removeFromQueue,
    clearQueue,
    reorderQueue,
  } = useContext(PlayerContext);

  // NO HOOKS HERE (important)
  const showSidebar = isQueueOpen && currentSong;

  const upcomingFromPlaylist = Array.isArray(playlist)
    ? playlist.slice(currentIndex + 1)
    : [];

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = queue.findIndex((s) => s._id === active.id);
    const newIndex = queue.findIndex((s) => s._id === over.id);

    reorderQueue(oldIndex, newIndex);
  };

  return (
    <motion.aside
      animate={{ x: showSidebar ? 0 : 360 }}
      initial={false}
      transition={{ duration: 0.25 }}
      className="fixed right-0 top-[64px] w-[360px] bg-[#1b1230] text-white border-l border-purple-700 shadow-2xl z-[60] flex flex-col"
      style={{ height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
    >
      {!showSidebar ? null : (
        <>
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-700">
            <div>
              <p className="text-xs uppercase tracking-wide text-purple-300">
                Queue
              </p>
              <p className="text-sm text-purple-100">
                Drag to reorder, click to play
              </p>
            </div>

            <div className="flex items-center gap-2">
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-xs flex items-center gap-1 text-purple-200 hover:text-white"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
              )}

              <button
                onClick={() => setIsQueueOpen(false)}
                className="p-1 rounded-full hover:bg-purple-800"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Now Playing */}
            <section>
              <p className="text-xs uppercase text-purple-300 mb-2">
                Now Playing
              </p>
              <div className="flex items-center gap-3 bg-purple-900/40 rounded-xl px-3 py-2">
                {currentSong.coverUrl && (
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-sm">{currentSong.title}</p>
                  <p className="text-xs text-purple-200">{currentSong.artist}</p>
                </div>
              </div>
            </section>

            {/* Queue Section */}
            <section>
              <p className="text-xs uppercase text-purple-300 mb-2">
                Up Next (Queue)
              </p>

              {queue.length === 0 ? (
                <p className="text-xs text-purple-200">No queued songs yet.</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                >
                  <SortableContext
                    items={queue.map((s) => s._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {queue.map((song) => (
                        <SortableQueueItem
                          key={song._id}
                          song={song}
                          playSong={playSong}
                          removeFromQueue={removeFromQueue}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </section>

            {/* Next from Playlist */}
            {upcomingFromPlaylist.length > 0 && (
              <section className="pt-2 border-t border-purple-800/60">
                <p className="text-xs uppercase text-purple-300 mb-2">
                  Next from playlist
                </p>
                <div className="space-y-1">
                  {upcomingFromPlaylist.map((song) => (
                    <button
                      key={song._id}
                      onClick={() => playSong(song, playlist)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-purple-900/50 text-left text-xs"
                    >
                      {song.coverUrl && (
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-9 h-9 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-[0.8rem] leading-tight">
                          {song.title}
                        </p>
                        <p className="text-[0.7rem] text-purple-200">
                          {song.artist}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </motion.aside>
  );
}
