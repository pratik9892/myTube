
export const getPublicId = (url) => {
    return url?.split("/upload/")[1]?.split(".")[0]?.split("/")?.slice(1)?.join("/")
}