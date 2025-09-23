import * as React from "react";

export function useMediaQuery(query: string) {
  const getMatches = React.useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = React.useState<boolean>(getMatches);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const updateMatches = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQueryList.matches);

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", updateMatches);
      return () => {
        mediaQueryList.removeEventListener("change", updateMatches);
      };
    }

    mediaQueryList.addListener(updateMatches);
    return () => {
      mediaQueryList.removeListener(updateMatches);
    };
  }, [query]);

  return matches;
}
