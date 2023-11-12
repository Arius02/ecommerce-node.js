export const paginationFunction=({page=1,size=2})=>{
    if(page<1)page=1
    if(size<1)size=2
    const limit=size
    const skip =(page-1)*size
    return {limit,skip} 
}
//for total nubmber of pages
export const getTotalPages=(totalCount,size=2)=> {
    const itemsPerPage = size||2 * 1 || 10;
    return Math.ceil(totalCount / itemsPerPage);
  }