package com.examples.common;

import android.graphics.Color;
import android.graphics.Rect;

import com.cloudroom.tool.AndroidTool;
import com.google.gson.JsonObject;

public class MixerContentHelper {

    private static JsonObject createBaseContent(int type, Rect rect) {
        JsonObject json = new JsonObject();
        json.addProperty("type", type);
        json.addProperty("top", rect.top);
        json.addProperty("left", rect.left);
        json.addProperty("width", rect.right - rect.left);
        json.addProperty("height", rect.bottom - rect.top);
        return json;
    }

    public static JsonObject createVideoContent(String userID, short camID,
                                                Rect rect) {
        JsonObject content = createBaseContent(0, rect);
        JsonObject param = new JsonObject();
        param.addProperty("camid", String.format("%s.%d", userID, camID));
        content.add("param", param);
        return content;
    }

    /**
     * 录制影音内容构造
     *
     * @param rect
     *            显示位置
     */
    public static JsonObject createMediaContent(Rect rect) {
        return createBaseContent(3, rect);
    }

    public static JsonObject createTimeStampContent(Rect rect) {
        return MixerContentHelper.createTextContent("%timestamp%", rect, Color.WHITE, Color.parseColor("#88000000"), 16, 6);
    }

    /**
     * 录制远端屏幕构造
     *
     * @param rect
     *            显示位置
     */
    public static JsonObject createRemoteScreenContent(Rect rect) {
        return createBaseContent(5, rect);
    }

    /**
     * 录制屏幕构造
     *
     * @param rect
     *            显示位置
     */
    public static JsonObject createScreenContent(Rect rect) {
        return createBaseContent(2, rect);
    }

    /**
     * 录制视频内容构造
     *
     * @param resID
     *            资源ID
     * @param rect
     *            显示区域
     */
    public static JsonObject createPicContent(String resID, Rect rect) {
        JsonObject content = createBaseContent(1, rect);
        JsonObject param = new JsonObject();
        param.addProperty("resourceid", resID);
        content.add("param", param);
        return content;
    }

    public static JsonObject createTextContent(String text, Rect rect) {
        JsonObject content = createBaseContent(7, rect);
        JsonObject param = new JsonObject();
        param.addProperty("text", text);
        content.add("param", param);
        return content;
    }

    public static JsonObject createTextContent(String text, Rect rect, int color, int backgroundColor, int fontSize, int textMargin) {
        JsonObject content = createBaseContent(10, rect);
        JsonObject param = new JsonObject();
        param.addProperty("text", text);
        param.addProperty("color", AndroidTool.toHexEncoding(color));
        param.addProperty("background", AndroidTool.toHexEncoding(backgroundColor));
        param.addProperty("font-size", ""+fontSize);
        param.addProperty("text-margin", ""+textMargin);
        content.add("param", param);
        return content;
    }
}
