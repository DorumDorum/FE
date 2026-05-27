export function goBack(navigate, fallback = '/') {
  const hasPrevious = typeof window !== 'undefined' && window.history.state?.idx > 0;
  if (hasPrevious) {
    navigate(-1);
  } else {
    navigate(fallback);
  }
}

