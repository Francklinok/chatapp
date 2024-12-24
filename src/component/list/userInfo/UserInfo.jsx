import "./userInfo.css";
import { useUserStore } from "../../../lib/userStore";
import { useState } from "react";

const UserInfo = () => {
  const { currentUser } = useUserStore();
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(false);
  console.log("currentuser avatar is ", currentUser.avatar.url);

  return (
    <>
      <div className="userinfo">
        <div className="user">
          <img src={currentUser?.avatar.url || "./avatar.png"} alt="" />
          <h3>{currentUser.username}</h3>
        </div>
        <div className="icons">
          <div className="searchbar">
            <img
              src="./search.png"
              alt="Icone de recherche"
              onClick={() => setVisible((prev) => !prev)}
            />
            {visible && (
              <input
                type="text"
                placeholder="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            )}
          </div>
          <img className="" src="./more.png" alt="" />
          <img className="" src="./edit.png" alt="" />
        </div>
      </div>
    </>
  );
};

export default UserInfo;
