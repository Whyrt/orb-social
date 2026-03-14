import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

const FriendListItem = React.memo(({ friend, onClick, onDeleteRequest }) => {
    const [{ x }, api] = useSpring(() => ({ x: 0 }));
    const bind = useDrag(({ down, movement: [mx], cancel, tap }) => {
        if (tap) return;
        if (!down && mx < -100) { cancel(); onDeleteRequest(friend); }
        api.start({ x: down ? mx : 0, immediate: down });
    }, { axis: 'x', from: () => [x.get(), 0], bounds: { left: -100, right: 0 }, rubberband: true });

    return (
        <div className="relative w-full overflow-hidden bg-black">
            <div className="absolute top-0 right-0 h-full w-24 flex items-center justify-center bg-red-500/20 text-red-500 font-bold text-xs uppercase z-0">Remove</div>
            <animated.div
                {...bind()}
                style={{ x, touchAction: 'pan-y', zIndex: 10 }}
                className="relative bg-black w-full"
                onClick={() => onClick(friend)}
            >
                <div className="group flex items-center justify-between py-4 border-b border-white/5 cursor-pointer">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white font-bold group-hover:bg-green-400 group-hover:text-black transition-all">{friend[0].toUpperCase()}</div>
                        <h3 className="text-white font-medium text-lg">@{friend}</h3>
                    </div>
                </div>
            </animated.div>
        </div>
    );
});
FriendListItem.displayName = 'FriendListItem';

export default FriendListItem;