const getToken = (bearerToken) => {
    // Check if the bearerToken starts with the expected BEARRER_TOKEN value
    const isBearer = bearerToken.startsWith(process.env.BEARRER_TOKEN);
    // Split the bearerToken to extract the token itself
    const token = bearerToken.split(process.env.BEARRER_TOKEN)[1];
    // Return an object with the isBearer flag and the extracted token
    return {
      isBearer,
      token
    };
  };
  
  export default getToken;
  