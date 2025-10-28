using Newtonsoft.Json;
using System.Collections.Generic;
using System.ComponentModel;

namespace SDKDemo
{
 
    enum VCALLSDK_ERR_DEF //错误枚举定义
    {
        VCALLSDK_NOERR = 0,

        //基础错误
        VCALLSDK_UNKNOWERR,                 //未知错误
        VCALLSDK_OUTOF_MEM,                 //内存不足
        VCALLSDK_INNER_ERR,                 //sdk内部错误
        VCALLSDK_MISMATCHCLIENTVER,         //不支持的sdk版本
        VCALLSDK_MEETPARAM_ERR,             //参数错误
        VCALLSDK_ERR_DATA,                  //无效数据
        VCALLSDK_ANCTPSWD_ERR,              //帐号密码不正确
        VCALLSDK_SERVER_EXCEPTION,          //服务异常
        VCALLSDK_LOGINSTATE_ERROR,			//登录状态错误
        VCALLSDK_USER_BEEN_KICKOUT,			//用户被踢掉

        //网络
        VCALLSDK_NETWORK_INITFAILED = 200,        //网络初始化失败
        VCALLSDK_NO_SERVERINFO,             //没有服务器信息
        VCALLSDK_NOSERVER_RSP,              //服务器没有响应
        VCALLSDK_CREATE_CONN_FAILED,        //创建连接失败
        VCALLSDK_SOCKETEXCEPTION,           //socket异常
        VCALLSDK_SOCKETTIMEOUT,             //网络超时
        VCALLSDK_FORCEDCLOSECONNECTION,     //连接被关闭
        VCALLSDK_CONNECTIONLOST,            //连接丢失

        //队列相关错误定义
        VCALLSDK_QUE_ID_INVALID = 400,            //队列ID错误
        VCALLSDK_QUE_NOUSER,                //没有用户在排队
        VCALLSDK_QUE_USER_CANCELLED,        //排队用户已取消
        VCALLSDK_QUE_SERVICE_NOT_START,
        VCALLSDK_ALREADY_OTHERQUE,          //已在其它队列排队(客户只能在一个队列排队)

        //呼叫
        VCALLSDK_INVALID_CALLID = 600,            //无效的呼叫ID
        VCALLSDK_ERR_CALL_EXIST,            //已在呼叫中
        VCALLSDK_ERR_BUSY,                  //对方忙
        VCALLSDK_ERR_OFFLINE,               //对方不在线
        VCALLSDK_ERR_NOANSWER,              //对方无应答
        VCALLSDK_ERR_USER_NOT_FOUND,        //用户不存在
        VCALLSDK_ERR_REFUSE,                //对方拒接

        //会话业务错误
        VCALLSDK_MEETNOTEXIST = 800,              //会议不存在或已结束
        VCALLSDK_AUTHERROR,                 //会议密码不正确
        VCALLSDK_MEMBEROVERFLOWERROR,       //会议终端数量已满（购买的license不够)
        VCALLSDK_RESOURCEALLOCATEERROR,     //分配会议资源失败
    };

    enum MIXER_STATE //录制状态
    {
        MST_NULL = 0,
        MST_STARTING,
        MST_RUNNING,
        MST_PAUSED,
        MST_STOPPING
    };

    enum MIXER_OUTPUT_TYPE
    {
        MIXOT_FILE = 0,
        MIXOT_LIVE
    };

    enum LOCMIXER_OUTPUT_STATE
    {
        LOCMOST_CREATE = 0,
        LOCMOST_INFOUPDATE,
        LOCMOST_CLOSE,
        LOCMOST_ERR
    }

    enum CLOUDMIXER_OUTPUT_STATE
    {
        CLOUDMOST_NULL = 0,    //未录制
        CLOUDMOST_RUNNING,     //录制中
        CLOUDMOST_STOPPED,     //录制结束
        CLOUDMOST_FAIL,        //录制失败
    }

    enum MIXER_VCONTENT_TYPE
    {
        MIXVTP_VIDEO = 0,
        MIXVTP_PIC,
        MIXVTP_SCREEN,
        MIXVTP_MEDIA,
        MIXVTP_SCREEN_SHARED = 5,
        MIXVTP_WBOARD,
        MIXVTP_TEXT = 10,
    };


    class paramCam
    {
        public string camid;
    }


    public class MixerContentObj
    {
        public int type;
        public int keepAspectRatio;
        public int left;
        public int top;
        public int width;
        public int height;
        public object param;
    }

    public class LocMixerCfgObj
    {
        public int width;
        public int height;
        public int frameRate;
        public int bitRate;
        public int defaultQP;
        public int gop;
    }

    public class LocMixerOutputInfoObj
    {
        public int state;
        public int duration;
        public int filesize;
        public int errCode;
    }
    public class LocMixeroutputObjFile
    {
        public int type;
        public string filename;
        public int encryptType;
        public int isUploadOnRecording;
        public string serverPathFileName;
        public string liveUrl;
        public int errRetryTimes;
    }

    public class CloudMixerInfo
    {
        public string ID;
        public string owner;
        public string cfg;
        public int state;
    }

    public class CloudMixerVideoFileCfg
    {
        public int aStreamType = 1;
        public int vWidth;
        public int vHeight;
        public int vFps;
        public int vBps;
        public int vQP;
        public string svrPathName;
        public object layoutConfig;
    }

    public class CloudMixerCfgObj
    {
        public int mode = 0;
        public CloudMixerVideoFileCfg videoFileCfg;
    }

    public class CloudMixerOutputInfo
    {
        public string id;
        public int state;
        public string svrFilePathName;
        public long startTime;
        public long fileSize;
        public int duration;
        public int errCode;
        public string errDesc;
        public float progress; //0~100
    }

    public class CloudMixerErrInfo
    {
        public int err;
        public string errDesc;
    }

    public class VideoCfg
    {
        public string size;
        public int fps;
        public int maxbps;
        public int qp_min;
        public int qp_max;
    }

    //{"queID":0,"position":3,"queuingTime":17}
    public class VideoSessionInfo
    {
        public string callID;
        public string peerID;
        public string peerName;
        public bool bCallAccepted;
        public int meetingID;
        public string meetingPswd;
        public string meetUrl;
        public int duration;
    };

    //{"queID":000001,"usrID":"31231231","name":"aaa","queuingTime":10,"usrExtDat":""}
    public class UserInfo
    {
        public int queID;
        public string usrID;
        public string name;
        public int queuingTime;
        public string usrExtDat;
    };

    //{"queID":0,"name":"aaa","desc":"this is desc","prio":1}
    public class QueueInfo
    {
        public int queID;
        public string name;
        public string desc;
        public int prio;
    };

    //{"queID":0,"agent_num":12,"wait_num":3,"srv_num":11}    
    public class QueueStatus
    {
        public int queID;
        public int agent_num;
        public int wait_num;
        public int srv_num;
    };

    //注意基类和重写函数，否则界面不会自动刷新
    class QueueStatusItem : INotifyPropertyChanged
    {
        // #region INotifyPropertyChanged 成员
        public event PropertyChangedEventHandler PropertyChanged;
        public void RaisePropertyChanged(string PropertyName)
        {
            if (PropertyChanged != null)
            {
                PropertyChanged(this, new PropertyChangedEventArgs(PropertyName));
            }
        }
        //#endregion

        private string queName;
        private int queID;
        private int agent_num;
        private int wait_num;
        private int srv_num;
        private int priority;
        private bool isServing;
        private string servicesDesc;

        public string QueueName
        {
            get { return queName; }
            set { queName = value; }
        }

        public int QueID
        {
            get { return queID; }
            set { queID = value; }
        }
        public int Agent_num
        {
            get { return agent_num; }
            set { agent_num = value; RaisePropertyChanged("Agent_num"); }
        }
        public int Wait_num
        {
            get { return wait_num; }
            set { wait_num = value; RaisePropertyChanged("Wait_num"); }
        }
        public int Srv_num
        {
            get { return srv_num; }
            set { srv_num = value; RaisePropertyChanged("Srv_num"); }
        }
        public int Priority
        {
            get { return priority; }
            set { priority = value; }
        }
        public bool IsServing
        {
            get { return isServing; }
            set { isServing = value; }
        }
        public string ServiceDesc
        {
            get { return servicesDesc; }
            set { servicesDesc = value; RaisePropertyChanged("ServiceDesc"); }
        }

        public QueueStatusItem(string name, int id, int agent, int wait, int srv, int p, bool isSrv, string desc)
        {
            queName = name;
            queID = id;
            agent_num = agent;
            wait_num = wait;
            srv_num = srv;
            priority = p;
            isServing = isSrv;
            servicesDesc = desc;
        }
    }

    //{"queID":0,"name":"bbb","desc":"this is desc","prio":2}
    public class QueuingInfo
    {
        public int queID;
        public int position;
        public int queuingTime;
    };

    //{"userID":"111","videoID":1}

    public class UserVideo
    {
        public string userID;
        public int videoID;
    };

    public class UserVideoList
    {
        public List<UserVideo> videos;

        public int count
        {
            get { return videos.Count; }
        }
    };

    public class AudioCfg
    {
        public string micID;
        public string spkID;
    };

    //{"userID":"111","videoID":2,"videoName":"camera2"}
    public class VideoInfo
    {
        public string userID;
        public string devID;
        public int videoID;
        public string videoName;
    };

    public class AudioInfo
    {
        public string id;
        public string name;
    };

    //{ "filePathName": "D:\\1.mp4" ,"recordWidth":640, "recordHeight":320, "frameRate":8, "bitRate":500000, "defaultQP":28, "recDataType":1} 
    public class RecordCfg
    {
        public string filePathName;
        public int recordWidth;     //录制文件的宽高
        public int recordHeight;
        public int frameRate;
        public int bitRate;
        public int defaultQP;
        public int recDataType;
    };

    public class Record
    {
        public int left;    //录制有效视频内容的位置和宽高
        public int top;
        public int width;
        public int height;
        public int type; //录制类型，参看文档REC_VCONTENT_TYPE定义
        public int keepAspectRatio;
    };

    public class RecordCam : Record
    {
        public class CamParams
        {
            public string camid;
        };

        public CamParams param = new CamParams();
    };

    //{"ID":"100"}
    public class MeetObj
    {
        public int ID;
    }

}
