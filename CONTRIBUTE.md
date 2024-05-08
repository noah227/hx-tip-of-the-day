## 简要说明

### 关于文件结构
* 每条tip都是一个独立的markdown文件（其拥有自己的文件夹）
* tip不直接写在运行时读取的目录( `/tips` )，而是使用builder生成，见下 [builder](#builder)

### 关于开发与设计

* 运行规则
	- [x] 每日运行一次/每次启动IDE时运行（可配置）
	- [x] 集成在菜单栏（帮助 > 每日小贴士），允许用户手动调用
	- [x] 面板展示前一个、后一个、不再展示
	* 总之，比葫芦画瓢idea系列 `Tip of the Day` 的功能
* 基础数据构成，来自 [官方教程](https://hx.dcloud.net.cn/Tutorial/UserGuide/skill) 的部分内容
	* 从官方摘取的tip以下划线开头命名
	* 部分异常（占用空间大，无效信息量多）的图片可能被替换
* 请勿重复
* 生成入口 `package.json.scripts.generate`

## builder

```
builder                
├ customized // 自定义tip资源，关于如何自定义，见其中template           
│  ├ template          
│  ├ test_template     
│  └ README.md         
├ media.replacement // 自定义资源替换   
│  ├ medias // 资源文件夹            
│  ├ README.md         
│  └ replacement.json  
├ out // 一次输出内容（生成分两部分，首先生成在此文件夹，然后迁移到tips文件夹）                  
│  ├ customized        
│  ├ images            
│  └ markdowns         
├ common.js            
├ generate.core.js // 用于处理资源生成，核心部分     
└ generate.js          

```

## 输出文件夹（二次输出内容）构成

```
tips                                           
├ images                   
├ markdowns                                    
│  └ _tip文件夹               
│     └ tip.md                          
└ README.md                                    
```
