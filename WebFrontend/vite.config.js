export default{
    define: {
      __SERVICE_BASE__: JSON.stringify(process.env.SERVICE_BASE || "http://dev-01:8080"),
    }
  };