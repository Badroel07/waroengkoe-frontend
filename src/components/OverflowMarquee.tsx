import { useState, useRef, useEffect } from 'react';

interface OverflowMarqueeProps {
    text?: any;
    children?: any;
    className?: string;
}

const OverflowMarquee = ({ text, children, className = "" }: OverflowMarqueeProps) => {
    const content = text || children;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [isOverflowing, setIsOverflowing] = useState<boolean>(false);
    const [scrollDistance, setScrollDistance] = useState<number>(0);

    useEffect(() => {
        if (!containerRef.current || !contentRef.current) return;

        const container = containerRef.current;
        const contentEl = contentRef.current;

        const checkOverflow = () => {
            const containerWidth = container.clientWidth;
            const contentWidth = contentEl.scrollWidth;
            const overflow = contentWidth > containerWidth;
            setIsOverflowing(overflow);
            if (overflow) {
                setScrollDistance(contentWidth - containerWidth + 20);
            } else {
                setScrollDistance(0);
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            checkOverflow();
        });

        resizeObserver.observe(container);
        resizeObserver.observe(contentEl);

        checkOverflow();

        return () => {
            resizeObserver.disconnect();
        };
    }, [content]);

    const animationStyle: React.CSSProperties = isOverflowing ? {
        animation: `marquee-title ${Math.max(2, scrollDistance / 50)}s linear infinite alternate`,
        '--scroll-distance': `-${scrollDistance}px`
    } as any : {};

    return (
        <div
            ref={containerRef}
            className={`overflow-hidden whitespace-nowrap ${className}`}
            style={{ position: 'relative' }}
        >
            <div
                ref={contentRef}
                className="inline-block"
                style={animationStyle}
            >
                {content}
            </div>
        </div>
    );
};

export default OverflowMarquee;
