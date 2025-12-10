// import { useEffect } from 'react';
// import { useLocation } from 'react-router-dom';

// const ScrollToTop: React.FC = () => {
//   const { pathname } = useLocation();

//   useEffect(() => {
//     window.scrollTo(0, 0); // Scroll to top-left
//   }, [pathname]);

//   return null;
// };

// export default ScrollToTop;

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
