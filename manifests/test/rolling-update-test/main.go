package main

import (
	"fmt"
	"log"
	"net/http"
)

func sayhello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "This is version 1.") //这个写入到w的是输出到客户端的
}

func main() {
	http.HandleFunc("/", sayhello) //设置访问的路由
	log.Println("This is version 1.")
	err := http.ListenAndServe(":9090", nil) //设置监听的端口
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
